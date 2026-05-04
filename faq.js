/**
 * YatrAmore FAQ Hub Logic
 * Handles accordions, search filtering with debouncing, and hit highlighting.
 */

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    const searchInput = document.getElementById('faq-search');
    const categories = document.querySelectorAll('.faq-category');
    
    // Create "No Results" element if it doesn't exist
    let noResults = document.getElementById('faq-no-results');
    if (!noResults) {
        noResults = document.createElement('div');
        noResults.id = 'faq-no-results';
        noResults.className = 'faq-no-results glass';
        noResults.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No matching questions found</h3>
            <p>Try using different keywords or check out our other categories.</p>
        `;
        noResults.style.display = 'none';
        document.querySelector('.faq-container').appendChild(noResults);
    }

    // --- 1. Accordion Toggle Logic ---
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) otherItem.classList.remove('active');
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // --- 2. Search Logic with Debouncing & Highlighting ---
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            
            // Delay execution by 200ms to improve performance (Debounce)
            searchTimeout = setTimeout(() => {
                const term = e.target.value.toLowerCase().trim();
                let totalVisible = 0;

                categories.forEach(category => {
                    let categoryHasVisibleItems = false;
                    const items = category.querySelectorAll('.faq-item');

                    items.forEach(item => {
                        const h3 = item.querySelector('h3');
                        const answerContent = item.querySelector('.answer-content');
                        
                        // Get original text for highlighting
                        const questionText = h3.textContent;
                        const answerText = answerContent.textContent;

                        if (term === "") {
                            // Reset state if search is empty
                            item.style.display = 'block';
                            h3.innerHTML = questionText;
                            answerContent.innerHTML = answerText;
                            categoryHasVisibleItems = true;
                            totalVisible++;
                        } else if (questionText.toLowerCase().includes(term) || answerText.toLowerCase().includes(term)) {
                            item.style.display = 'block';
                            categoryHasVisibleItems = true;
                            totalVisible++;
                            
                            // Highlight matches
                            h3.innerHTML = highlightMatch(questionText, term);
                            answerContent.innerHTML = highlightMatch(answerText, term);
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    // Hide the whole category if no questions match
                    category.style.display = categoryHasVisibleItems ? 'block' : 'none';
                });

                // Toggle "No Results" message
                noResults.style.display = totalVisible === 0 ? 'block' : 'none';

            }, 200);
        });
    }

    /**
     * Helper: Wraps matching text in <mark> tags
     */
    function highlightMatch(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark class="faq-highlight">$1</mark>');
    }
});
