import re

def clean_text(text: str) -> str:
    """
    Cleans and standardizes extracted document text.
    Removes extraneous control characters, excessive newlines,
    and trailing whitespaces while preserving structural formatting.
    """
    if not text:
        return ""
    
    # Replace non-breaking spaces and zero-width spaces
    text = text.replace('\xa0', ' ').replace('\u200b', '')
    
    # Replace carriage returns
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove control characters except standard whitespace and tabs
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Collapse multiple consecutive spaces (keep newlines)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Collapse 3 or more newlines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
