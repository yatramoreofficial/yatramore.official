import os
import glob

# Get all html files in the directory
html_files = glob.glob('/Users/yaza/Desktop/AntiGrav/Yatramore/website/Moderators/*.html')

for file_path in html_files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Step 1
    content = content.replace('<div class="moderator-hero-content">', '<div class="moderator-glass-card">')
    
    # Step 2
    old_mid = """            </div>
        </section>



        <section class="moderator-socials">"""
    
    new_mid = """                <div class="moderator-divider"></div>
                <section class="moderator-socials">"""
    
    # Fallback in case spacing is weird
    if old_mid not in content:
        # Try a more resilient replacement for the middle section
        import re
        content = re.sub(r'</div>\s*</section>\s*<section class="moderator-socials">', 
                         '<div class="moderator-divider"></div>\n                <section class="moderator-socials">', 
                         content)
    else:
        content = content.replace(old_mid, new_mid)
        
    # Step 3
    old_end = """        </section>
    </main>"""
    
    new_end = """        </section>
            </div>
        </section>
    </main>"""
    
    content = content.replace(old_end, new_end)
    
    with open(file_path, 'w') as f:
        f.write(content)

print(f"Updated {len(html_files)} HTML files successfully.")
