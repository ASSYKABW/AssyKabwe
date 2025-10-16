// CareerBoost Frontend Application
class CareerBoostApp {
  constructor() {
    this.apiBase = '/api';
    this.token = localStorage.getItem('careerboost_token');
    this.user = null;
    this.state = {
      role: 'seeker',
      modalOpen: false,
      isAuthenticated: false
    };

    this.init();
  }

  async init() {
    // Check if user is already authenticated
    if (this.token) {
      await this.loadUser();
    }

    this.setupEventListeners();
    this.updateUI();
  }

  // API Helper Methods
  async apiCall(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async loadUser() {
    try {
      const response = await this.apiCall('/auth/me');
      this.user = response.data;
      this.state.isAuthenticated = true;
      this.state.role = this.user.role;
    } catch (error) {
      console.error('Failed to load user:', error);
      this.logout();
    }
  }

  async login(email, password) {
    try {
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      this.token = response.data.token;
      this.user = response.data.user;
      this.state.isAuthenticated = true;
      this.state.role = this.user.role;

      localStorage.setItem('careerboost_token', this.token);
      this.updateUI();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await this.apiCall('/auth/register', {
        method: 'POST',
        body: userData
      });

      this.token = response.data.token;
      this.user = response.data.user;
      this.state.isAuthenticated = true;
      this.state.role = this.user.role;

      localStorage.setItem('careerboost_token', this.token);
      this.updateUI();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    this.state.isAuthenticated = false;
    localStorage.removeItem('careerboost_token');
    this.updateUI();
  }

  // AI Service Methods
  async rewriteCV(cvContent, targetRole, targetIndustry) {
    try {
      this.showAIModal('Rewriting CV...', 'Processing with AI — connecting to service...');

      // First, create/upload CV
      const cvResponse = await this.apiCall('/cv/upload', {
        method: 'POST',
        body: {
          title: `CV for ${targetRole}`,
          content: cvContent,
          target_role: targetRole,
          target_industry: targetIndustry
        }
      });

      const cvId = cvResponse.data.id;

      // Then rewrite it
      const rewriteResponse = await this.apiCall(`/cv/${cvId}/rewrite`, {
        method: 'POST',
        body: {
          target_role: targetRole,
          target_industry: targetIndustry
        }
      });

      const result = rewriteResponse.data;

      this.updateAIModal('CV Rewrite Result', 'Preview — edit and save', this.formatCVResult(result));

      return { success: true, data: result };
    } catch (error) {
      this.updateAIModal('Error', 'Failed to rewrite CV', error.message);
      return { success: false, error: error.message };
    }
  }

  async optimizeLinkedIn(headline, summary, skills, targetRole, targetIndustry) {
    try {
      this.showAIModal('Optimizing LinkedIn...', 'Processing...');

      const response = await this.apiCall('/linkedin/optimize', {
        method: 'POST',
        body: {
          headline,
          summary,
          skills,
          target_role: targetRole,
          target_industry: targetIndustry
        }
      });

      const result = response.data;
      this.updateAIModal('LinkedIn Optimization', 'Preview — edit and save', this.formatLinkedInResult(result));

      return { success: true, data: result };
    } catch (error) {
      this.updateAIModal('Error', 'Failed to optimize LinkedIn profile', error.message);
      return { success: false, error: error.message };
    }
  }

  async startInterviewSimulation(jobRole, experienceLevel, interviewType, companyName) {
    try {
      this.showAIModal('Starting mock interview...', 'Generating questions...');

      const response = await this.apiCall('/interview', {
        method: 'POST',
        body: {
          job_role: jobRole,
          experience_level: experienceLevel,
          interview_type: interviewType,
          company_name: companyName
        }
      });

      const interview = response.data;

      // Start the interview
      await this.apiCall(`/interview/${interview.id}/start`, {
        method: 'POST'
      });

      this.updateAIModal('Interview Simulation', 'Ready to begin', this.formatInterviewStart(interview));

      return { success: true, data: interview };
    } catch (error) {
      this.updateAIModal('Error', 'Failed to start interview simulation', error.message);
      return { success: false, error: error.message };
    }
  }

  // Payment Methods
  async createStripeCheckout(plan) {
    try {
      const response = await this.apiCall('/payments/stripe/create-checkout', {
        method: 'POST',
        body: {
          plan,
          success_url: `${window.location.origin}/success?plan=${plan}`,
          cancel_url: `${window.location.origin}/cancel`
        }
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      alert(`Payment error: ${error.message}`);
    }
  }

  async createPayFastPayment(plan) {
    try {
      const response = await this.apiCall('/payments/payfast/create-payment', {
        method: 'POST',
        body: {
          plan,
          success_url: `${window.location.origin}/success?plan=${plan}`,
          cancel_url: `${window.location.origin}/cancel`
        }
      });

      // Create and submit PayFast form
      this.submitPayFastForm(response.data.payment_url, response.data.payment_data);
    } catch (error) {
      alert(`Payment error: ${error.message}`);
    }
  }

  submitPayFastForm(actionUrl, formData) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;

    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  // UI Helper Methods
  formatCVResult(result) {
    return `**CV Rewrite Complete**

**Improvements Made:**
${result.ai_feedback?.improvements?.map(imp => `• ${imp}`).join('\n') || 'Various improvements applied'}

**Keywords Added:**
${result.keywords_added?.join(', ') || 'Industry-relevant keywords'}

**Score Improvement:**
Original: ${result.original_score || 'N/A'} → Improved: ${result.improved_score || 'N/A'}

**Target Role:** ${result.target_role}

**Recommendations:**
${result.ai_feedback?.recommendations?.map(rec => `• ${rec}`).join('\n') || 'Continue optimizing based on specific job requirements'}`;
  }

  formatLinkedInResult(result) {
    return `**LinkedIn Profile Optimized**

**New Headline:**
${result.optimized_headline}

**Optimized Summary:**
${result.optimized_summary}

**Recommended Skills:**
${result.optimized_skills?.join(', ') || 'Skills updated'}

**Keywords Added:**
${result.keyword_suggestions?.join(', ') || 'Industry keywords'}

**Profile Strength:**
Before: ${result.profile_strength_before || 'N/A'} → After: ${result.profile_strength_after || 'N/A'}`;
  }

  formatInterviewStart(interview) {
    const questions = interview.questions || [];
    return `**Mock Interview Ready**

**Role:** ${interview.job_role}
**Company:** ${interview.company_name || 'Generic Company'}
**Questions:** ${questions.length} questions prepared
**Type:** ${interview.interview_type}

**First Question:**
${questions[0]?.question || 'Questions are being prepared...'}

Click "Start Interview" to begin the simulation.`;
  }

  showAIModal(title, subtitle, content = '') {
    const aiBackdrop = document.getElementById('aiBackdrop');
    const aiTitle = document.getElementById('aiTitle');
    const aiSubtitle = document.getElementById('aiSubtitle');
    const aiContent = document.getElementById('aiContent');

    aiTitle.textContent = title;
    aiSubtitle.textContent = subtitle;
    aiContent.textContent = content;

    aiBackdrop.style.display = 'flex';
    aiBackdrop.setAttribute('aria-hidden', 'false');
  }

  updateAIModal(title, subtitle, content) {
    document.getElementById('aiTitle').textContent = title;
    document.getElementById('aiSubtitle').textContent = subtitle;
    document.getElementById('aiContent').textContent = content;
  }

  closeAIModal() {
    const aiBackdrop = document.getElementById('aiBackdrop');
    aiBackdrop.style.display = 'none';
    aiBackdrop.setAttribute('aria-hidden', 'true');
  }

  // Modal Management
  openModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    modalBackdrop.style.display = 'flex';
    modalBackdrop.setAttribute('aria-hidden', 'false');
    this.state.modalOpen = true;
  }

  closeModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    modalBackdrop.style.display = 'none';
    modalBackdrop.setAttribute('aria-hidden', 'true');
    this.state.modalOpen = false;
  }

  // UI Updates
  updateUI() {
    // Update authentication state
    const loginBtns = document.querySelectorAll('#loginBtn, #footer-login');
    const signupBtns = document.querySelectorAll('#signupBtn, #footer-signup');

    if (this.state.isAuthenticated) {
      loginBtns.forEach(btn => {
        btn.textContent = 'Dashboard';
        btn.onclick = () => this.goToDashboard();
      });
      signupBtns.forEach(btn => {
        btn.textContent = 'Logout';
        btn.onclick = () => this.logout();
      });
    } else {
      loginBtns.forEach(btn => {
        btn.textContent = 'Login';
        btn.onclick = () => this.openModal();
      });
      signupBtns.forEach(btn => {
        btn.textContent = 'Get Started';
        btn.onclick = () => this.openModal();
      });
    }

    // Update role-specific content
    if (this.state.role === 'recruiter') {
      document.getElementById('cta-cv').textContent = 'Post a Role';
    } else {
      document.getElementById('cta-cv').textContent = 'Rewrite My CV';
    }
  }

  goToDashboard() {
    // In a real app, this would navigate to a dashboard page
    alert('Dashboard functionality would be implemented here with routing.');
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Role switch buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        this.state.role = btn.dataset.role;
        this.updateUI();
      });
    });

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
    document.getElementById('closeAi').addEventListener('click', () => this.closeAIModal());

    // Auth form
    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const userData = {
        full_name: formData.get('fullName'),
        email: formData.get('email'),
        password: 'demo-password', // In real app, add password field
        role: formData.get('roleSelect') || 'seeker'
      };

      // For demo, we'll register the user
      const result = await this.register(userData);
      if (result.success) {
        this.closeModal();
        alert(`Welcome, ${userData.full_name}! You're now signed in.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    });

    // Feature CTAs
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        this.handleFeatureAction(action);
      });
    });

    // Hero CTAs
    document.getElementById('cta-cv').addEventListener('click', () => this.handleFeatureAction('rewrite-cv'));
    document.getElementById('demo-rewrite').addEventListener('click', () => this.handleFeatureAction('rewrite-cv'));
    document.getElementById('cta-interview').addEventListener('click', () => this.handleFeatureAction('start-interview'));
    document.getElementById('cta-linkedin').addEventListener('click', () => this.handleFeatureAction('boost-linkedin'));

    // Pricing CTAs
    document.querySelectorAll('[data-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.dataset.plan;
        this.handlePlanSelection(plan);
      });
    });

    // AI Modal actions
    document.getElementById('aiSave').addEventListener('click', () => {
      alert('Content saved to your profile (demo functionality)');
      this.closeAIModal();
    });

    document.getElementById('aiEdit').addEventListener('click', () => {
      const current = document.getElementById('aiContent').textContent;
      const edited = prompt('Edit the content below:', current) || current;
      document.getElementById('aiContent').textContent = edited;
    });

    // Testimonial carousel
    document.querySelectorAll('.dot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dot-btn').forEach(d => d.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.dataset.index, 10);
        document.getElementById('test-1').style.display = idx === 0 ? 'block' : 'none';
        document.getElementById('test-2').style.display = idx === 1 ? 'block' : 'none';
      });
    });

    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state.modalOpen) this.closeModal();
        this.closeAIModal();
      }
    });

    // Initialize testimonial display
    document.getElementById('test-2').style.display = 'none';
  }

  async handleFeatureAction(action) {
    if (!this.state.isAuthenticated) {
      this.openModal();
      return;
    }

    switch (action) {
      case 'rewrite-cv':
        await this.promptCvRewrite();
        break;
      case 'start-interview':
        await this.promptInterviewSimulation();
        break;
      case 'boost-linkedin':
        await this.promptLinkedInBoost();
        break;
      case 'find-jobs':
        alert('Job search functionality - would redirect to job dashboard');
        break;
      case 'hire-talent':
        alert('Recruiter outreach functionality - would open outreach wizard');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  async promptCvRewrite() {
    const cvContent = prompt('Paste your CV text (or click Cancel to use demo sample):') || 
      'Software engineer with experience in web development. Responsible for various projects and tasks.';
    const targetRole = prompt('Target job title (e.g. Senior Frontend Engineer):', 'Senior Frontend Engineer');

    if (!targetRole) return;

    await this.rewriteCV(cvContent, targetRole, 'Technology');
  }

  async promptLinkedInBoost() {
    const headline = prompt('Current LinkedIn headline:', 'Software Engineer');
    const summary = prompt('Current LinkedIn summary:', 'Experienced software engineer with passion for technology...');
    const targetRole = prompt('Target role:', 'Senior Software Engineer');

    if (!targetRole) return;

    await this.optimizeLinkedIn(headline, summary, ['JavaScript', 'React', 'Node.js'], targetRole, 'Technology');
  }

  async promptInterviewSimulation() {
    const jobRole = prompt('Which role should we simulate an interview for?', 'Software Engineer');
    const experienceLevel = prompt('Experience level (entry/junior/mid/senior/executive):', 'mid');

    if (!jobRole) return;

    await this.startInterviewSimulation(jobRole, experienceLevel, 'mixed', 'Tech Company');
  }

  handlePlanSelection(plan) {
    if (plan === 'basic') {
      alert('You selected the Basic (Free) plan. Sign up to get started!');
      if (!this.state.isAuthenticated) {
        this.openModal();
      }
      return;
    }

    if (!this.state.isAuthenticated) {
      alert('Please sign up first to select a paid plan.');
      this.openModal();
      return;
    }

    if (plan === 'corporate') {
      alert('Corporate plan requires custom pricing. Please contact our sales team.');
      return;
    }

    // For South African users, prefer PayFast
    const usePayFast = confirm('Choose payment method:\nOK = PayFast (South African Rand)\nCancel = Stripe (USD)');
    
    if (usePayFast) {
      this.createPayFastPayment(plan);
    } else {
      this.createStripeCheckout(plan);
    }
  }
}

// Initialize the application
const app = new CareerBoostApp();