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

        for filename in os.listdir(self.directory):
            if not filename.endswith(".md"):
                continue
            filepath = os.path.join(self.directory, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for YAML frontmatter block
                if not content.startswith("---"):
                    print(f"Warning: {filename} does not start with YAML frontmatter separator, skipping.")
                    continue
                
                parts = content.split("---", 2)
                if len(parts) < 3:
                    print(f"Warning: {filename} has incomplete frontmatter separators, skipping.")
                    continue
                
                frontmatter_raw = parts[1]
                body = parts[2].strip()
                
                try:
                    frontmatter = yaml.safe_load(frontmatter_raw)
                except Exception as ex:
                    print(f"Warning: YAML parse error in {filename}: {ex}, skipping.")
                    continue
                
                if not frontmatter or 'type' not in frontmatter:
                    print(f"Warning: {filename} frontmatter missing required 'type' field, skipping.")
                    continue
                
                # Title defaults to filename if omitted
                title = frontmatter.get("title") or os.path.splitext(filename)[0]
                tags = frontmatter.get("tags") or []
                if isinstance(tags, str):
                    tags = [t.strip() for t in tags.split(",") if t.strip()]
                
                concept = {
                    "filename": filename,
                    "filepath": filepath,
                    "type": frontmatter["type"],
                    "title": title,
                    "tags": tags,
                    "description": frontmatter.get("description", ""),
                    "content": body
                }
                self.concepts.append(concept)
                print(f"Loaded OKF Concept: {title} (tags: {tags})")
            except Exception as e:
                print(f"Warning: Unhandled error parsing {filename}: {e}, skipping.")

    def match_concept(self, query: str) -> dict | None:
        """
        Scan loaded concepts and return the first matching concept.
        Matches if any words in the query overlap with the concept's title or tags.
        """
        # Tokenize query to lowercase alphanumeric words
        query_words = set(re.findall(r'[a-zA-Z0-9]+', query.lower()))
        if not query_words:
            return None
            
        for concept in self.concepts:
            # Tokenize title and tags
            title_words = set(re.findall(r'[a-zA-Z0-9]+', concept['title'].lower()))
            tag_words = {tag.lower() for tag in concept['tags']}
            
            # Deterministic matching overlap
            if title_words.intersection(query_words) or tag_words.intersection(query_words):
                return concept
        return None
