"""
AI Service for Portfolio Generation using OpenAI GPT-4o
"""
from openai import OpenAI
import os
import json
import re
from typing import Dict, List, Optional

# Initialize OpenAI client (lazy initialization)
_client = None

def get_client():
    """Get or create OpenAI client"""
    global _client
    if _client is None:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key)
    return _client

def generate_portfolio_from_prompt(user_prompt: str, template: str = "modern") -> Dict:
    """
    Generate portfolio structure from text prompt
    
    Args:
        user_prompt: User's description (e.g., "Create a portfolio for a React developer...")
        template: Template style (modern, minimal, creative)
    
    Returns:
        Dict with portfolio data structure
    """
    
    system_prompt = """You are an expert portfolio website builder and career consultant.
    Your job is to extract information from user input and create a professional portfolio structure.
    
    Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
    {
        "personalInfo": {
            "name": "Full Name",
            "title": "Professional Title (e.g., Full-Stack Developer)",
            "email": "email@example.com",
            "phone": "+1234567890",
            "location": "City, Country",
            "linkedin": "https://linkedin.com/in/username",
            "github": "https://github.com/username",
            "website": "https://example.com"
        },
        "bio": "Engaging 2-3 sentence professional summary that highlights expertise and passion",
        "skills": ["Skill1", "Skill2", "Skill3"],
        "projects": [
            {
                "title": "Project Name",
                "description": "Compelling 2-3 sentence description of the project and its impact",
                "technologies": ["Tech1", "Tech2"],
                "github": "https://github.com/user/repo",
                "live": "https://project-demo.com",
                "highlights": ["Key achievement 1", "Key achievement 2"]
            }
        ],
        "experience": [
            {
                "company": "Company Name",
                "position": "Job Title",
                "duration": "Jan 2020 - Present",
                "location": "City, Country",
                "responsibilities": ["Achievement 1", "Achievement 2"]
            }
        ],
        "education": [
            {
                "institution": "University/School Name",
                "degree": "Degree Type",
                "field": "Field of Study",
                "year": "2020",
                "gpa": "3.8/4.0"
            }
        ],
        "certifications": [
            {
                "name": "Certification Name",
                "issuer": "Issuing Organization",
                "year": "2023"
            }
        ],
        "theme": {
            "primary": "#hex-color",
            "accent": "#hex-color",
            "layout": "modern"
        }
    }
    
    Important guidelines:
    - Infer reasonable information from context
    - Make bio engaging and professional
    - Create 3-5 realistic projects if not specified
    - Use appropriate color scheme for the profession
    - Fill in all fields with realistic data
    """
    
    try:
        client = get_client()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Template style: {template}\n\nUser request: {user_prompt}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=3000
        )
        
        content = response.choices[0].message.content
        portfolio_data = json.loads(content)
        
        # Validate structure
        if not _validate_portfolio_structure(portfolio_data):
            raise ValueError("Invalid portfolio structure returned by AI")
        
        return portfolio_data
        
    except Exception as e:
        print(f"❌ Error generating portfolio from prompt: {e}")
        raise


def generate_portfolio_from_resume(resume_text: str, template: str = "modern") -> Dict:
    """
    Generate portfolio structure from resume text
    
    Args:
        resume_text: Extracted text from resume PDF/DOCX
        template: Template style
    
    Returns:
        Dict with portfolio data structure
    """
    
    system_prompt = """You are an expert at analyzing resumes and creating professional portfolios.
    Extract ALL relevant information from the resume and create an engaging portfolio structure.
    
    Guidelines:
    - Extract name, contact info, education, experience, skills, projects
    - Create an engaging bio based on the person's background
    - Highlight key achievements and quantifiable results
    - Suggest appropriate color scheme based on industry
    - Make descriptions compelling and achievement-focused
    
    Return ONLY valid JSON (no markdown, no code blocks) with the portfolio structure."""
    
    try:
        client = get_client()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Template: {template}\n\nResume:\n{resume_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=3500
        )
        
        content = response.choices[0].message.content
        portfolio_data = json.loads(content)
        
        if not _validate_portfolio_structure(portfolio_data):
            raise ValueError("Invalid portfolio structure returned by AI")
        
        return portfolio_data
        
    except Exception as e:
        print(f"❌ Error generating portfolio from resume: {e}")
        raise


def refine_portfolio(portfolio_data: Dict, user_request: str, conversation_history: List = None) -> Dict:
    """
    Refine existing portfolio based on user feedback
    
    Args:
        portfolio_data: Current portfolio data
        user_request: User's modification request
        conversation_history: Previous conversation messages
    
    Returns:
        Updated portfolio data
    """
    
    system_prompt = """You are helping refine a portfolio website.
    The user will request changes like "make it more colorful", "add more projects", etc.
    Update the portfolio JSON accordingly while maintaining the structure.
    
    Return the COMPLETE updated JSON (no markdown, no code blocks)."""
    
    try:
        client = get_client()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Current portfolio:\n{json.dumps(portfolio_data, indent=2)}"}
        ]
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current request
        messages.append({"role": "user", "content": user_request})
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=3500
        )
        
        content = response.choices[0].message.content
        updated_portfolio = json.loads(content)
        
        if not _validate_portfolio_structure(updated_portfolio):
            raise ValueError("Invalid portfolio structure after refinement")
        
        return updated_portfolio
        
    except Exception as e:
        print(f"❌ Error refining portfolio: {e}")
        raise


def generate_html_from_data(portfolio_data: Dict, template: str = "modern") -> str:
    """
    Generate complete HTML/CSS portfolio from data
    
    Args:
        portfolio_data: Portfolio data structure
        template: Template style
    
    Returns:
        Complete HTML string
    """
    
    system_prompt = """You are an expert frontend developer specializing in portfolio websites.
    Generate a complete, modern, responsive HTML portfolio website with inline CSS.
    
    Requirements:
    - Modern design with smooth animations
    - Fully responsive (mobile, tablet, desktop)
    - Beautiful color scheme with gradients
    - Professional typography
    - Smooth scroll behavior
    - Interactive hover effects
    - Clean, semantic HTML5
    - Include ALL sections: hero, about, skills, projects, experience, education, contact
    - Use the exact data provided
    - NO external dependencies (no Bootstrap, no CDN links)
    - ALL CSS must be inline in <style> tags
    
    Return ONLY the complete HTML (no markdown code blocks, no explanations)."""
    
    try:
        client = get_client()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Template style: {template}\n\nPortfolio data:\n{json.dumps(portfolio_data, indent=2)}\n\nGenerate complete HTML with inline CSS."}
            ],
            temperature=0.8,
            max_tokens=16000
        )
        
        html_content = response.choices[0].message.content
        
        # Clean up markdown code blocks if present
        html_content = _clean_html_response(html_content)
        
        return html_content
        
    except Exception as e:
        print(f"❌ Error generating HTML: {e}")
        raise


def _validate_portfolio_structure(data: Dict) -> bool:
    """Validate portfolio data structure"""
    required_keys = ['personalInfo', 'bio', 'skills', 'projects']
    return all(key in data for key in required_keys)


def _clean_html_response(html: str) -> str:
    """Clean AI response to extract pure HTML"""
    # Remove markdown code blocks
    html = re.sub(r'^```html\s*\n', '', html, flags=re.MULTILINE)
    html = re.sub(r'^```\s*$', '', html, flags=re.MULTILINE)
    html = html.strip()
    return html


def estimate_generation_time(input_type: str, has_resume: bool = False) -> int:
    """
    Estimate generation time in seconds
    
    Args:
        input_type: "prompt" or "resume"
        has_resume: Whether resume parsing is needed
    
    Returns:
        Estimated time in seconds
    """
    base_time = 30  # Base generation time
    
    if input_type == "resume" or has_resume:
        base_time += 20  # Extra time for resume parsing
    
    return base_time
