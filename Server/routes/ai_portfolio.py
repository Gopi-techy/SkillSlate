"""
AI Portfolio Generation Routes with Real-time Progress
"""
from flask import Blueprint, request, jsonify, stream_with_context, Response
from utils.validators import validate_auth_token
from utils.ai_service import (
    generate_portfolio_from_prompt,
    generate_portfolio_from_resume,
    refine_portfolio,
    generate_html_from_data,
    estimate_generation_time
)
from utils.document_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    detect_file_type,
    validate_resume_size
)
from models.portfolio import Portfolio
from datetime import datetime
import json
import time
import traceback

ai_portfolio_bp = Blueprint('ai_portfolio', __name__, url_prefix='/api/ai/portfolio')


@ai_portfolio_bp.route('/generate', methods=['POST'])
@validate_auth_token
def generate_portfolio(current_user):
    """
    Generate portfolio from prompt or resume
    
    Request body:
    {
        "prompt": "text prompt",  // OR
        "template": "modern/minimal/creative",
        "generationType": "prompt" or "resume"
    }
    
    For resume upload, file should be in multipart/form-data
    """
    try:
        generation_type = request.form.get('generationType', 'prompt')
        template = 'modern'  # Default template
        
        # Estimate generation time
        estimated_time = estimate_generation_time(generation_type, 'resume' in request.files)
        
        if generation_type == 'resume' and 'resume' in request.files:
            # Handle resume upload
            resume_file = request.files['resume']
            
            if not resume_file or resume_file.filename == '':
                return jsonify({
                    'success': False,
                    'message': 'No resume file provided'
                }), 400
            
            # Validate file type
            file_type = detect_file_type(resume_file.filename)
            if file_type not in ['pdf', 'docx', 'doc']:
                return jsonify({
                    'success': False,
                    'message': 'Invalid file type. Please upload PDF or DOCX file.'
                }), 400
            
            # Validate file size
            resume_file.seek(0, 2)  # Seek to end
            file_size = resume_file.tell()
            resume_file.seek(0)  # Reset to beginning
            
            if not validate_resume_size(file_size, max_size_mb=5):
                return jsonify({
                    'success': False,
                    'message': 'File too large. Maximum size is 5MB.'
                }), 400
            
            # Extract text from resume
            try:
                file_content = resume_file.read()
                
                if file_type == 'pdf':
                    resume_text = extract_text_from_pdf(file_content)
                elif file_type in ['docx', 'doc']:
                    resume_text = extract_text_from_docx(file_content)
                else:
                    return jsonify({
                        'success': False,
                        'message': 'Unsupported file format'
                    }), 400
                
                if not resume_text or len(resume_text.strip()) < 100:
                    return jsonify({
                        'success': False,
                        'message': 'Could not extract enough text from resume. Please try a different file.'
                    }), 400
                
            except Exception as e:
                print(f"❌ Resume parsing error: {e}")
                return jsonify({
                    'success': False,
                    'message': f'Failed to parse resume: {str(e)}'
                }), 400
            
            # Generate portfolio from resume
            portfolio_data = generate_portfolio_from_resume(resume_text, template)
            
        else:
            # Handle text prompt
            prompt = request.form.get('prompt') or request.json.get('prompt')
            
            if not prompt:
                return jsonify({
                    'success': False,
                    'message': 'Prompt is required'
                }), 400
            
            # Generate portfolio from prompt
            portfolio_data = generate_portfolio_from_prompt(prompt, template)
        
        # Generate HTML from data
        html_content = generate_html_from_data(portfolio_data, template)
        
        # Save to database as draft
        portfolio = Portfolio(
            user_id=current_user['user_id'],
            name=portfolio_data.get('personalInfo', {}).get('name', 'Untitled Portfolio'),
            template=template,
            status='draft',
            data=portfolio_data,
            html=html_content
        )
        
        portfolio_id = portfolio.save()
        
        return jsonify({
            'success': True,
            'message': 'Portfolio generated successfully',
            'estimatedTime': estimated_time,
            'portfolio': {
                'id': str(portfolio_id),
                'data': portfolio_data,
                'html': html_content,
                'template': template
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Portfolio generation error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Failed to generate portfolio: {str(e)}'
        }), 500


@ai_portfolio_bp.route('/generate-stream', methods=['POST'])
@validate_auth_token
def generate_portfolio_stream(current_user):
    """
    Generate portfolio with real-time progress updates (SSE)
    """
    def generate():
        try:
            generation_type = request.form.get('generationType', 'prompt')
            template = request.form.get('template', 'modern')
            
            # Step 1: Initialize
            yield f"data: {json.dumps({'step': 'initialize', 'progress': 0, 'message': 'Starting portfolio generation...'})}\n\n"
            time.sleep(0.5)
            
            # Step 2: Parse input
            yield f"data: {json.dumps({'step': 'parsing', 'progress': 10, 'message': 'Processing your input...'})}\n\n"
            time.sleep(0.5)
            
            portfolio_data = None
            resume_text = None
            
            if generation_type == 'resume' and 'resume' in request.files:
                resume_file = request.files['resume']
                
                # Validate and parse
                file_type = detect_file_type(resume_file.filename)
                if file_type not in ['pdf', 'docx', 'doc']:
                    yield f"data: {json.dumps({'step': 'error', 'progress': 0, 'message': 'Invalid file type'})}\n\n"
                    return
                
                yield f"data: {json.dumps({'step': 'parsing', 'progress': 20, 'message': 'Extracting text from resume...'})}\n\n"
                
                file_content = resume_file.read()
                if file_type == 'pdf':
                    resume_text = extract_text_from_pdf(file_content)
                else:
                    resume_text = extract_text_from_docx(file_content)
                
                time.sleep(0.5)
            else:
                prompt = request.form.get('prompt') or request.json.get('prompt', '')
                if not prompt:
                    yield f"data: {json.dumps({'step': 'error', 'progress': 0, 'message': 'No prompt provided'})}\n\n"
                    return
            
            # Step 3: AI Analysis
            yield f"data: {json.dumps({'step': 'analyzing', 'progress': 30, 'message': 'AI is analyzing your information...'})}\n\n"
            time.sleep(1)
            
            # Step 4: Generate structure
            yield f"data: {json.dumps({'step': 'structuring', 'progress': 50, 'message': 'Creating portfolio structure...'})}\n\n"
            
            if resume_text:
                portfolio_data = generate_portfolio_from_resume(resume_text, template)
            else:
                prompt = request.form.get('prompt', '')
                portfolio_data = generate_portfolio_from_prompt(prompt, template)
            
            time.sleep(0.5)
            
            # Step 5: Generate HTML
            yield f"data: {json.dumps({'step': 'designing', 'progress': 70, 'message': 'Designing your portfolio website...'})}\n\n"
            time.sleep(1)
            
            html_content = generate_html_from_data(portfolio_data, template)
            
            # Step 6: Finalize
            yield f"data: {json.dumps({'step': 'finalizing', 'progress': 90, 'message': 'Finalizing your portfolio...'})}\n\n"
            time.sleep(0.5)
            
            # Save to database
            portfolio = Portfolio(
                user_id=current_user['user_id'],
                name=portfolio_data.get('personalInfo', {}).get('name', 'Untitled Portfolio'),
                template=template,
                status='draft',
                data=portfolio_data,
                html=html_content
            )
            
            portfolio_id = portfolio.save()
            
            # Step 7: Complete
            yield f"data: {json.dumps({'step': 'complete', 'progress': 100, 'message': 'Portfolio created successfully!', 'portfolio': {'id': str(portfolio_id), 'data': portfolio_data, 'html': html_content}})}\n\n"
            
        except Exception as e:
            print(f"❌ Stream generation error: {e}")
            print(traceback.format_exc())
            yield f"data: {json.dumps({'step': 'error', 'progress': 0, 'message': str(e)})}\n\n"
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@ai_portfolio_bp.route('/refine/<portfolio_id>', methods=['POST'])
@validate_auth_token
def refine_portfolio_endpoint(current_user, portfolio_id):
    """
    Refine existing portfolio based on user feedback
    
    Request body:
    {
        "request": "make it more colorful",
        "conversationHistory": []
    }
    """
    try:
        data = request.get_json()
        user_request = data.get('request')
        conversation_history = data.get('conversationHistory', [])
        
        if not user_request:
            return jsonify({
                'success': False,
                'message': 'Request is required'
            }), 400
        
        # Get portfolio
        portfolio = Portfolio.find_by_id_and_user(portfolio_id, current_user['user_id'])
        
        if not portfolio:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found'
            }), 404
        
        current_data = portfolio.get('data', {})
        template = portfolio.get('template', 'modern')
        
        # Refine portfolio
        updated_data = refine_portfolio(current_data, user_request, conversation_history)
        
        # Generate new HTML
        updated_html = generate_html_from_data(updated_data, template)
        
        # Update portfolio in database
        Portfolio.update_portfolio(portfolio_id, {
            'data': updated_data,
            'html': updated_html,
            'updatedAt': datetime.utcnow()
        })
        
        return jsonify({
            'success': True,
            'message': 'Portfolio refined successfully',
            'portfolio': {
                'id': portfolio_id,
                'data': updated_data,
                'html': updated_html
            }
        })
        
    except Exception as e:
        print(f"❌ Portfolio refinement error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Failed to refine portfolio: {str(e)}'
        }), 500


@ai_portfolio_bp.route('/estimate-time', methods=['POST'])
def estimate_time():
    """Estimate generation time"""
    try:
        data = request.get_json()
        generation_type = data.get('generationType', 'prompt')
        has_resume = data.get('hasResume', False)
        
        estimated_seconds = estimate_generation_time(generation_type, has_resume)
        
        return jsonify({
            'success': True,
            'estimatedTime': estimated_seconds,
            'estimatedMinutes': round(estimated_seconds / 60, 1)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@ai_portfolio_bp.route('/preview/<portfolio_id>', methods=['GET'])
@validate_auth_token
def get_preview(current_user, portfolio_id):
    """Get portfolio preview HTML"""
    try:
        portfolio = Portfolio.find_by_id_and_user(portfolio_id, current_user['user_id'])
        
        if not portfolio:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found'
            }), 404
        
        html_content = portfolio.get('html', '')
        
        if not html_content:
            return jsonify({
                'success': False,
                'message': 'Portfolio HTML not generated yet'
            }), 404
        
        return html_content, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
