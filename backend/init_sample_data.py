"""
Initialize sample Indian legal cases for FAISS search
"""
import numpy as np
import faiss
import pickle
from pathlib import Path

ROOT_DIR = Path(__file__).parent

# Sample Indian legal cases
sample_cases = [
    {
        "title": "Kesavananda Bharati v. State of Kerala (1973)",
        "snippet": "The Supreme Court held that while Parliament has wide powers to amend the Constitution, it cannot alter the basic structure of the Constitution. This landmark judgment established the doctrine of basic structure.",
        "citation": "AIR 1973 SC 1461",
        "url": "https://indiankanoon.org/doc/257876/",
        "text": "basic structure doctrine constitutional amendment parliament powers fundamental rights"
    },
    {
        "title": "Maneka Gandhi v. Union of India (1978)",
        "snippet": "The Supreme Court held that Article 21 of the Constitution guarantees not only protection of life and personal liberty but also the right to live with human dignity. This case expanded the interpretation of fundamental rights.",
        "citation": "AIR 1978 SC 597",
        "url": "https://indiankanoon.org/doc/1766147/",
        "text": "article 21 personal liberty human dignity fundamental rights procedure established by law"
    },
    {
        "title": "Vishaka v. State of Rajasthan (1997)",
        "snippet": "The Supreme Court laid down guidelines for prevention of sexual harassment of women at workplace. These guidelines were known as Vishaka Guidelines until the Sexual Harassment of Women at Workplace Act was enacted in 2013.",
        "citation": "AIR 1997 SC 3011",
        "url": "https://indiankanoon.org/doc/1031794/",
        "text": "sexual harassment workplace women rights guidelines vishaka PIL public interest litigation"
    },
    {
        "title": "Olga Tellis v. Bombay Municipal Corporation (1985)",
        "snippet": "The Supreme Court held that the right to livelihood is an integral part of the right to life under Article 21. The Court recognized that pavement dwellers have a right to life and cannot be evicted without following due process.",
        "citation": "AIR 1986 SC 180",
        "url": "https://indiankanoon.org/doc/709776/",
        "text": "right to livelihood article 21 pavement dwellers eviction due process fundamental rights"
    },
    {
        "title": "M.C. Mehta v. Union of India (Oleum Gas Leak Case) (1987)",
        "snippet": "The Supreme Court evolved the principle of absolute liability for enterprises engaged in hazardous activities. The Court held that such enterprises are absolutely liable to compensate for any harm caused by their activities.",
        "citation": "AIR 1987 SC 1086",
        "url": "https://indiankanoon.org/doc/1486949/",
        "text": "absolute liability environmental law hazardous substances enterprise liability compensation public interest"
    },
    {
        "title": "Mohd. Ahmed Khan v. Shah Bano Begum (1985)",
        "snippet": "The Supreme Court held that a divorced Muslim woman is entitled to maintenance under Section 125 of CrPC. This judgment sparked a nationwide debate on uniform civil code.",
        "citation": "AIR 1985 SC 945",
        "url": "https://indiankanoon.org/doc/823221/",
        "text": "maintenance divorced muslim woman section 125 crpc uniform civil code personal law"
    },
    {
        "title": "Indra Sawhney v. Union of India (Mandal Commission Case) (1992)",
        "snippet": "The Supreme Court upheld the validity of 27% reservation for Other Backward Classes (OBCs) in government jobs, subject to exclusion of the creamy layer. The Court also held that total reservation should not exceed 50%.",
        "citation": "AIR 1993 SC 477",
        "url": "https://indiankanoon.org/doc/1363234/",
        "text": "reservation OBC backward classes creamy layer 50 percent limit equality affirmative action"
    },
    {
        "title": "S.R. Bommai v. Union of India (1994)",
        "snippet": "The Supreme Court held that the exercise of power under Article 356 (President's Rule) is subject to judicial review. The Court laid down guidelines for the imposition of President's Rule.",
        "citation": "AIR 1994 SC 1918",
        "url": "https://indiankanoon.org/doc/60799/",
        "text": "article 356 presidents rule judicial review federalism state autonomy constitutional validity"
    },
    {
        "title": "Nirbhaya Case - Mukesh & Anr v. State for NCT of Delhi (2017)",
        "snippet": "The Supreme Court upheld the death penalty for the convicts in the brutal gang-rape and murder case. The Court emphasized the need to protect women's dignity and safety.",
        "citation": "(2017) 6 SCC 1",
        "url": "https://indiankanoon.org/doc/83617/",
        "text": "death penalty gang rape murder women safety criminal law rarest of rare"
    },
    {
        "title": "K.S. Puttaswamy v. Union of India (2017)",
        "snippet": "The Supreme Court unanimously held that the right to privacy is a fundamental right under Article 21 of the Constitution. This nine-judge bench overruled earlier judgments that held otherwise.",
        "citation": "AIR 2017 SC 4161",
        "url": "https://indiankanoon.org/doc/127517806/",
        "text": "right to privacy fundamental right article 21 aadhaar data protection personal liberty"
    },
    {
        "title": "Navtej Singh Johar v. Union of India (2018)",
        "snippet": "The Supreme Court decriminalized consensual homosexual acts between adults by reading down Section 377 of IPC. The Court held that sexual orientation is a natural phenomenon and discrimination on this ground violates constitutional morality.",
        "citation": "AIR 2018 SC 4321",
        "url": "https://indiankanoon.org/doc/168671544/",
        "text": "section 377 homosexuality LGBTQ rights sexual orientation constitutional morality dignity equality"
    },
    {
        "title": "Joseph Shine v. Union of India (2018)",
        "snippet": "The Supreme Court struck down Section 497 of IPC which criminalized adultery. The Court held that the provision was manifestly arbitrary and violated the right to equality.",
        "citation": "AIR 2019 SC 677",
        "url": "https://indiankanoon.org/doc/165806642/",
        "text": "adultery section 497 IPC arbitrary equality women rights dignity personal liberty"
    },
    {
        "title": "Indian Young Lawyers Association v. State of Kerala (Sabarimala Case) (2018)",
        "snippet": "The Supreme Court held that the practice of prohibiting women of menstruating age (10-50 years) from entering Sabarimala temple violates their right to worship and is discriminatory.",
        "citation": "AIR 2019 SC 1751",
        "url": "https://indiankanoon.org/doc/115860399/",
        "text": "sabarimala women entry temple religious freedom discrimination equality article 25 essential religious practices"
    },
    {
        "title": "Shreya Singhal v. Union of India (2015)",
        "snippet": "The Supreme Court struck down Section 66A of IT Act which dealt with sending offensive messages through communication services. The Court held it violated freedom of speech and expression.",
        "citation": "AIR 2015 SC 1523",
        "url": "https://indiankanoon.org/doc/110813550/",
        "text": "section 66A IT act freedom of speech expression internet rights online free speech article 19"
    },
    {
        "title": "Lily Thomas v. Union of India (2013)",
        "snippet": "The Supreme Court struck down Section 8(4) of Representation of People Act which allowed convicted MPs and MLAs to continue in office if they filed an appeal within 90 days.",
        "citation": "AIR 2013 SC 2662",
        "url": "https://indiankanoon.org/doc/93338318/",
        "text": "convicted politicians MPs MLAs disqualification representation of people act criminal conviction"
    }
]

def create_simple_embedding(text: str, dim: int = 512) -> np.ndarray:
    """Create a simple hash-based embedding"""
    words = text.lower().split()
    vector = np.zeros(dim)
    for i, word in enumerate(words):
        idx = hash(word) % dim
        vector[idx] += 1.0
    # Normalize
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector

def initialize_faiss_index():
    """Initialize FAISS index with sample cases"""
    dimension = 512
    
    # Create embeddings for all cases
    embeddings = []
    metadata = []
    
    for case in sample_cases:
        embedding = create_simple_embedding(case['text'])
        embeddings.append(embedding)
        metadata.append({
            'title': case['title'],
            'snippet': case['snippet'],
            'citation': case['citation'],
            'url': case['url']
        })
    
    # Convert to numpy array
    embeddings_array = np.array(embeddings).astype('float32')
    
    # Create FAISS index
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_array)
    
    # Save index and metadata
    with open(ROOT_DIR / 'faiss_index.pkl', 'wb') as f:
        pickle.dump(index, f)
    
    with open(ROOT_DIR / 'faiss_metadata.pkl', 'wb') as f:
        pickle.dump(metadata, f)
    
    print(f"✓ Successfully initialized FAISS index with {len(sample_cases)} cases")
    print(f"✓ Index saved to {ROOT_DIR / 'faiss_index.pkl'}")
    print(f"✓ Metadata saved to {ROOT_DIR / 'faiss_metadata.pkl'}")

if __name__ == "__main__":
    initialize_faiss_index()
