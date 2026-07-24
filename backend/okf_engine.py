import os
import re
import yaml

# Resolve path to okf_knowledge/ directory (located at project root)
OKF_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "okf_knowledge"))

# ponytail: shared stop words for tokenization; keep small, no NLP dep.
_STOP = {"the", "and", "for", "with", "this", "that", "from", "into", "your",
         "are", "was", "have", "has", "will", "not", "but", "all", "can",
         "data", "table", "column", "value", "each", "item", "type", "name",
         "list", "used", "use", "using", "field", "fields", "when", "then",
         "what", "how", "why", "who", "where", "which", "does", "did", "do",
         "about", "they", "them", "their", "there", "than", "only", "some",
         "any", "should", "would", "could", "may", "might"}


def _tokens(s: str) -> set:
    raw = {t for t in re.findall(r'[a-zA-Z0-9_]+', s.lower()) if t not in _STOP}
    short = {t for t in re.findall(r'\b[a-zA-Z0-9_]{2,}\b', s.lower()) if t not in _STOP and len(t) <= 3}
    return raw | short


# Resolve path to okf_knowledge/ directory (located at project root)

class OKFEngine:
    def __init__(self, directory=OKF_DIR):
        self.directory = directory
        self.concepts = []
        self._token_to_concepts: dict[str, set] = {}
        self.load_concepts()
        self._build_index()

    def _build_index(self):
        """ponytail: inverted token index for cross-referencing related concepts."""
        self._token_to_concepts = {}
        for c in self.concepts:
            if c.get("type") in ("persona", "instruction"):
                continue
            for t in self._concept_tokens(c):
                self._token_to_concepts.setdefault(t, set()).add(c["id"])

    def _concept_tokens(self, concept: dict) -> set:
        text = " ".join([
            str(concept.get("id", "")),
            str(concept.get("title", "")),
            " ".join(str(t) for t in concept.get("tags", [])),
        ])
        return _tokens(text) | set(re.split(r'[/_-]', concept.get("id", "").lower()))

    def related_concepts(self, concept_ids: list[str], top_n: int = 5) -> list[str]:
        """Return concept IDs related to any of the given concept IDs by shared tokens."""
        related: dict[str, int] = {}
        for cid in concept_ids:
            # Find tokens for this concept
            concept = next((c for c in self.concepts if c["id"] == cid), None)
            if not concept:
                continue
            for t in self._concept_tokens(concept):
                for other_id in self._token_to_concepts.get(t, set()):
                    if other_id != cid:
                        related[other_id] = related.get(other_id, 0) + 1
        ranked = sorted(related.items(), key=lambda x: x[1], reverse=True)
        return [cid for cid, _ in ranked[:top_n]]

    def load_concepts(self):
        self.concepts = []
        if not os.path.exists(self.directory):
            print(f"Creating OKF knowledge directory: {self.directory}")
            os.makedirs(self.directory, exist_ok=True)
            return

        for root, _, files in os.walk(self.directory):
            for filename in files:
                if not filename.endswith(".md"):
                    continue
                # Skip reserved OKF filenames
                if filename in ("index.md", "log.md"):
                    continue

                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, self.directory)
                concept_id = os.path.splitext(rel_path)[0]

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for YAML frontmatter block
                    if not content.startswith("---"):
                        print(f"Warning: {rel_path} does not start with YAML frontmatter separator, skipping.")
                        continue
                    
                    parts = content.split("---", 2)
                    if len(parts) < 3:
                        print(f"Warning: {rel_path} has incomplete frontmatter separators, skipping.")
                        continue
                    
                    frontmatter_raw = parts[1]
                    body = parts[2].strip()
                    
                    try:
                        frontmatter = yaml.safe_load(frontmatter_raw)
                    except Exception as ex:
                        print(f"Warning: YAML parse error in {rel_path}: {ex}, skipping.")
                        continue
                    
                    if not frontmatter or 'type' not in frontmatter:
                        print(f"Warning: {rel_path} frontmatter missing required 'type' field, skipping.")
                        continue
                    
                    # Title defaults to the concept base name if omitted
                    title = frontmatter.get("title") or os.path.basename(concept_id)
                    tags = frontmatter.get("tags") or []
                    if isinstance(tags, str):
                        tags = [t.strip() for t in tags.split(",") if t.strip()]
                    
                    concept = {
                        "id": concept_id,
                        "filename": filename,
                        "filepath": filepath,
                        "type": frontmatter["type"],
                        "title": title,
                        "tags": tags,
                        "description": frontmatter.get("description", ""),
                        "resource": frontmatter.get("resource", ""),
                        "timestamp": frontmatter.get("timestamp", ""),
                        "content": body
                    }
                    self.concepts.append(concept)
                    print(f"Loaded OKF Concept: {concept_id} [Type: {frontmatter['type']}] (title: {title}, tags: {tags})")
                except Exception as e:
                    print(f"Warning: Unhandled error parsing {rel_path}: {e}, skipping.")

    def match_concept(self, query: str) -> dict | None:
        """
        Scan loaded concepts and return the first matching concept.
        Matches if any words in the query overlap with the concept's ID, title, or tags.
        """
        # Tokenize query to lowercase alphanumeric words and slashes/dashes
        query_words = set(re.findall(r'[a-zA-Z0-9/_-]+', query.lower()))
        if not query_words:
            return None
            
        for concept in self.concepts:
            if concept.get("type") in ("persona", "instruction"):
                continue
            # Tokenize ID, title, and tags
            id_parts = set(re.split(r'[/_-]', concept['id'].lower())) | {concept['id'].lower()}
            title_words = set(re.findall(r'[a-zA-Z0-9]+', concept['title'].lower()))
            tag_words = {tag.lower() for tag in concept['tags']}
            
            # Deterministic matching overlap
            if (id_parts.intersection(query_words) or 
                title_words.intersection(query_words) or 
                tag_words.intersection(query_words)):
                return concept
        return None

    def match_concepts(self, query: str) -> list:
        """
        Scan loaded concepts and return the best matching concepts.
        Scores by overlap of query terms with id, title, and tags.
        Returns top 3 matches to keep responses focused.
        """
        STOP = {"the", "and", "for", "with", "this", "that", "from", "into", "your",
                "are", "was", "have", "has", "will", "not", "but", "all", "can",
                "data", "table", "column", "value", "each", "item", "type", "name",
                "list", "used", "use", "using", "field", "fields", "when", "then"}
        def _tokens(s):
            raw = {t for t in re.findall(r'[a-zA-Z0-9_]+', s.lower()) if t not in STOP}
            short = {t for t in re.findall(r'\b[a-zA-Z0-9_]{2,}\b', s.lower()) if t not in STOP and len(t) <= 3}
            return raw | short

        query_words = _tokens(query)
        if not query_words:
            return []

        scored = []
        for concept in self.concepts:
            if concept.get("type") in ("persona", "instruction"):
                continue
            id_parts = set(re.split(r'[/_-]', concept['id'].lower())) | {concept['id'].lower()}
            title_words = set(re.findall(r'[a-zA-Z0-9]+', concept['title'].lower()))
            tag_words = {tag.lower() for tag in concept['tags']}

            score = 0
            id_hits = id_parts & query_words
            title_hits = title_words & query_words
            tag_hits = tag_words & query_words

            if id_hits:
                score += len(id_hits) * 10
            if title_hits:
                score += len(title_hits) * 5
            if tag_hits:
                score += len(tag_hits) * 3

            if score > 0:
                scored.append((score, concept))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:3]]


if __name__ == "__main__":
    eng = OKFEngine()
    # ponytail: prove 1-hop co-location — a query whose terms live only in the
    # report still drags in the docs it joins against.
    hits = eng.match_concepts("total revenue margin")
    ids = {c["id"] for c in hits}
    assert any("sales" in i for i in ids), f"co-location failed, got {ids}"
    print("okf_engine co-location:", sorted(ids))

