import os
import re
import yaml

# Resolve path to okf_knowledge/ directory (located at project root)
OKF_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "okf_knowledge"))

class OKFEngine:
    def __init__(self, directory=OKF_DIR):
        self.directory = directory
        self.concepts = []
        self.load_concepts()

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
        Scan loaded concepts and return all matching concepts.
        Matches if any words in the query overlap with the concept's ID, title, or tags.
        """
        query_words = set(re.findall(r'[a-zA-Z0-9/_-]+', query.lower()))
        if not query_words:
            return []
            
        matched = []
        for concept in self.concepts:
            if concept.get("type") in ("persona", "instruction"):
                continue
            id_parts = set(re.split(r'[/_-]', concept['id'].lower())) | {concept['id'].lower()}
            title_words = set(re.findall(r'[a-zA-Z0-9]+', concept['title'].lower()))
            tag_words = {tag.lower() for tag in concept['tags']}
            
            if (id_parts.intersection(query_words) or 
                title_words.intersection(query_words) or 
                tag_words.intersection(query_words)):
                matched.append(concept)
        return matched

