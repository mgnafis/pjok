class ExamSystem {
    constructor() {
        this.questions = [];
        this.examQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.totalQuestions = 40;
        
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.showScreen('start-screen');
    }

    async loadQuestions() {
        try {
            const response = await fetch('questions.json');
            this.questions = await response.json();
            console.log(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Error loading questions. Please refresh the page.');
        }
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startExam());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitExam());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartExam());
    }

    startExam() {
        this.selectRandomQuestions();
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.showScreen('exam-screen');
        this.displayQuestion();
    }

    selectRandomQuestions() {
        // Shuffle questions and select first 40 (or all if less than 40)
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        this.examQuestions = shuffled.slice(0, Math.min(this.totalQuestions, shuffled.length));
        this.totalQuestions = this.examQuestions.length;
        
        // Update total questions display
        document.getElementById('total-questions').textContent = this.totalQuestions;
        document.getElementById('total-count').textContent = this.totalQuestions;
    }

    displayQuestion() {
        const question = this.examQuestions[this.currentQuestionIndex];
        
        // Update question number and progress
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        const progress = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
        document.getElementById('progress').style.width = `${progress}%`;
        
        // Display question text
        document.getElementById('question-text').textContent = question.question;
        
        // Display image if exists
        const imageContainer = document.getElementById('question-image');
        if (question.has_image) {
            const imageNumber = this.extractImageNumber(question.question);
            if (imageNumber) {
                imageContainer.innerHTML = `<img src="./img/gambar${imageNumber}.png" alt="Question Image" />`;
            } else {
                imageContainer.innerHTML = '';
            }
        } else {
            imageContainer.innerHTML = '';
        }
        
        // Display options
        this.displayOptions(question);
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    extractImageNumber(questionText) {
        const match = questionText.match(/gambar(\d+)/i);
        return match ? match[1] : null;
    }

    displayOptions(question) {
        const container = document.getElementById('options-container');
        container.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `<div class="option-text">${option}</div>`;
            
            // Check if this option was previously selected
            const questionId = question.question_number;
            if (this.userAnswers[questionId] === option[0].toLowerCase()) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                // Remove selection from all options
                container.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                // Add selection to clicked option
                optionElement.classList.add('selected');
                // Store answer
                this.userAnswers[questionId] = option[0].toLowerCase();
            });
            
            container.appendChild(optionElement);
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        // Previous button
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // Next/Submit button
        if (this.currentQuestionIndex === this.totalQuestions - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    submitExam() {
        if (confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
            this.calculateResults();
            this.showResults();
            this.showScreen('results-screen');
        }
    }

    calculateResults() {
        let correctCount = 0;
        
        this.examQuestions.forEach(question => {
            const questionId = question.question_number;
            const userAnswer = this.userAnswers[questionId];
            const correctAnswer = question.answer;
            
            if (userAnswer === correctAnswer) {
                correctCount++;
            }
        });
        
        this.correctCount = correctCount;
        this.score = Math.round((correctCount / this.totalQuestions) * 100);
    }

    showResults() {
        // Update score display
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('correct-count').textContent = this.correctCount;
        
        // Show detailed review
        this.showQuestionReview();
    }

    showQuestionReview() {
        const reviewContainer = document.getElementById('question-review');
        reviewContainer.innerHTML = '';
        
        this.examQuestions.forEach((question, index) => {
            const questionId = question.question_number;
            const userAnswer = this.userAnswers[questionId];
            const correctAnswer = question.answer;
            
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            let statusClass = 'not-answered';
            let statusText = 'Not answered';
            
            if (userAnswer) {
                if (userAnswer === correctAnswer) {
                    statusClass = 'correct';
                    statusText = 'Correct';
                } else {
                    statusClass = 'incorrect';
                    statusText = 'Incorrect';
                }
            }
            
            const userAnswerText = userAnswer ? this.getOptionText(question, userAnswer) : 'No answer';
            const correctAnswerText = this.getOptionText(question, correctAnswer);
            
            reviewItem.innerHTML = `
                <div class="review-question">Question ${index + 1}: ${question.question}</div>
                <div class="review-answer ${statusClass}">Your answer: ${userAnswerText} (${statusText})</div>
                <div class="review-answer correct">Correct answer: ${correctAnswerText}</div>
            `;
            
            reviewContainer.appendChild(reviewItem);
        });
    }

    getOptionText(question, optionLetter) {
        const option = question.options.find(opt => opt[0].toLowerCase() === optionLetter);
        return option || 'Unknown';
    }

    restartExam() {
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.showScreen('start-screen');
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize the exam system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ExamSystem();
});

