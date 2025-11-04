"""
PDF and Document parsing utilities
"""
import re
from typing import Optional


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from PDF file
    
    Args:
        file_content: PDF file bytes
    
    Returns:
        Extracted text
    """
    try:
        # Try PyPDF2 first
        try:
            import PyPDF2
            from io import BytesIO
            
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return clean_extracted_text(text)
        except ImportError:
            print("⚠️ PyPDF2 not installed, trying pdfplumber...")
            
            # Fallback to pdfplumber
            import pdfplumber
            from io import BytesIO
            
            pdf_file = BytesIO(file_content)
            text = ""
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            return clean_extracted_text(text)
            
    except Exception as e:
        print(f"❌ Error extracting text from PDF: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(file_content: bytes) -> str:
    """
    Extract text from DOCX file
    
    Args:
        file_content: DOCX file bytes
    
    Returns:
        Extracted text
    """
    try:
        from docx import Document
        from io import BytesIO
        
        doc_file = BytesIO(file_content)
        doc = Document(doc_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return clean_extracted_text(text)
        
    except ImportError:
        raise ValueError("python-docx not installed. Install with: pip install python-docx")
    except Exception as e:
        print(f"❌ Error extracting text from DOCX: {e}")
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def clean_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted text
    
    Args:
        text: Raw extracted text
    
    Returns:
        Cleaned text
    """
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    
    # Remove special characters that cause issues
    text = text.replace('\x00', '')
    text = text.replace('\uf0b7', '•')  # Replace bullet point character
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def detect_file_type(filename: str) -> Optional[str]:
    """
    Detect file type from filename
    
    Args:
        filename: Name of the file
    
    Returns:
        File type: 'pdf', 'docx', 'txt', or None
    """
    filename_lower = filename.lower()
    
    if filename_lower.endswith('.pdf'):
        return 'pdf'
    elif filename_lower.endswith('.docx'):
        return 'docx'
    elif filename_lower.endswith('.doc'):
        return 'doc'
    elif filename_lower.endswith('.txt'):
        return 'txt'
    
    return None


def validate_resume_size(file_size: int, max_size_mb: int = 5) -> bool:
    """
    Validate resume file size
    
    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in MB
    
    Returns:
        True if valid, False otherwise
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes
