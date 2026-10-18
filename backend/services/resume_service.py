import io
from datetime import datetime, date
from jinja2 import Template


RESUME_DESIGN_1 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; padding: 32px; color: #1a1a1a; background: #fff; max-width: 820px; margin: 0 auto; font-size: 13px; }
  h1 { font-size: 26px; font-weight: 700; color: #1E293B; margin-bottom: 4px; text-align: center; }
  .contact { font-size: 12px; color: #475569; margin-bottom: 16px; text-align: center; }
  .contact span { margin: 0 8px; }
  .section-header { background: #FACC15; color: #1E293B; font-weight: 700; font-size: 13px; padding: 5px 10px; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .item { margin-bottom: 8px; }
  .item-row { display: flex; justify-content: space-between; align-items: baseline; }
  .item-title { font-weight: 600; font-size: 13px; }
  .item-date { font-size: 11px; color: #94A3B8; }
  .item-subtitle { font-size: 12px; color: #475569; margin-top: 1px; }
  .item-desc { font-size: 12px; color: #334155; margin-top: 3px; line-height: 1.5; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #F1F5F9; color: #334155; padding: 3px 10px; border-radius: 12px; font-size: 12px; border: 1px solid #E2E8F0; }
  table.edu-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.edu-table th { background: #F8FAFC; font-weight: 700; padding: 6px 10px; border: 1px solid #E2E8F0; text-align: left; color: #475569; }
  table.edu-table td { padding: 6px 10px; border: 1px solid #E2E8F0; }
  .personal-table { width: 100%; font-size: 12px; }
  .personal-table tr td:first-child { font-weight: 600; width: 160px; color: #475569; padding: 4px 0; }
  .personal-table tr td:last-child { color: #1E293B; }
  .declaration-text { font-size: 12px; line-height: 1.6; color: #334155; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px; }
</style>
</head>
<body>
  <table style="width: 100%; border: none; margin-bottom: 10px;">
    <tr style="border: none;">
      <td style="border: none; padding: 0; vertical-align: middle;">
        <h1 style="text-align: left; margin-bottom: 4px;">{{ name }}</h1>
        <div class="contact" style="text-align: left; margin-bottom: 0;">
          {% if email %}<span>{{ email }}</span>{% endif %}
          {% if phone %}<span>{{ phone }}</span>{% endif %}
          {% if address %}<span>{{ address }}</span>{% endif %}
        </div>
      </td>
      {% if photo_base64 %}
      <td style="border: none; padding: 0; width: 85px; text-align: right; vertical-align: middle;">
        <img src="{{ photo_base64 }}" style="width: 75px; height: 85px; object-fit: cover; border: 1px solid #cbd5e1; border-radius: 4px;" />
      </td>
      {% endif %}
    </tr>
  </table>

  {% if objective %}
  <div class="section-header">Career Objective</div>
  <div class="item-desc" style="margin-bottom:8px;">{{ objective }}</div>
  {% endif %}

  {% if education and education|length > 0 %}
  <div class="section-header">Education Qualification</div>
  <table class="edu-table">
    <tr>
      <th>Exam Name</th>
      <th>Board/University</th>
      <th>Year</th>
      <th>%/CGPA</th>
    </tr>
    {% for edu in education %}
    <tr>
      <td>{{ edu.exam_name or edu.degree or '' }}</td>
      <td>{{ edu.board or edu.institution or '' }}</td>
      <td>{{ edu.year or '' }}</td>
      <td>{{ edu.cgpa or '' }}</td>
    </tr>
    {% endfor %}
  </table>
  {% endif %}

  {% if skills and skills|length > 0 %}
  <div class="section-header">Skills</div>
  <div class="skills-list">
    {% for skill in skills %}<span class="skill-tag">{{ skill }}</span>{% endfor %}
  </div>
  {% endif %}

  {% if certifications and certifications|length > 0 %}
  <div class="section-header">Course Certifications</div>
  {% for cert in certifications %}
  <div class="item">
    <div class="item-row">
      <span class="item-title">{{ cert.name }}</span>
      {% if cert.year %}<span class="item-date">{{ cert.year }}</span>{% endif %}
    </div>
    {% if cert.issuer %}<div class="item-subtitle">{{ cert.issuer }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if experience and experience|length > 0 %}
  <div class="section-header">Work Experience</div>
  {% for exp in experience %}
  <div class="item">
    <div class="item-row">
      <span class="item-title">{{ exp.title }} — {{ exp.company }}</span>
      <span class="item-date">{{ exp.duration }}</span>
    </div>
    {% if exp.description %}<div class="item-desc">{{ exp.description }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if projects and projects|length > 0 %}
  <div class="section-header">Projects</div>
  {% for proj in projects %}
  <div class="item">
    <span class="item-title">{{ proj.name }}</span>
    {% if proj.description %}<div class="item-desc">{{ proj.description }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if personal_details %}
  <div class="section-header">Personal Details</div>
  <table class="personal-table">
    {% if personal_details.father_name %}<tr><td>Father's Name</td><td>{{ personal_details.father_name }}</td></tr>{% endif %}
    {% if personal_details.dob %}<tr><td>Date of Birth</td><td>{{ personal_details.dob }}</td></tr>{% endif %}
    {% if personal_details.gender %}<tr><td>Gender</td><td>{{ personal_details.gender }}</td></tr>{% endif %}
    {% if personal_details.nationality %}<tr><td>Nationality</td><td>{{ personal_details.nationality }}</td></tr>{% endif %}
    {% if personal_details.languages %}<tr><td>Language Known</td><td>{{ personal_details.languages }}</td></tr>{% endif %}
    {% if personal_details.religion %}<tr><td>Religion</td><td>{{ personal_details.religion }}</td></tr>{% endif %}
    {% if personal_details.hobbies %}<tr><td>Hobbies</td><td>{{ personal_details.hobbies }}</td></tr>{% endif %}
  </table>
  {% endif %}

  {% if declaration %}
  <div class="section-header">Declaration</div>
  <p class="declaration-text">{{ declaration }}</p>
  {% endif %}

  <div class="sign-row">
    <span>Date: ___________________</span>
    <span>{{ name }}</span>
  </div>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────────────────
# Design 2: Modern Two-Column Sidebar Layout (Blue sidebar with white content)
# ─────────────────────────────────────────────────────────────────────────────
RESUME_DESIGN_2 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; color: #1a1a1a; background: #fff; font-size: 12px; display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: #1E3A5F; color: #fff; padding: 28px 18px; min-height: 100%; flex-shrink: 0; }
  .main { flex: 1; padding: 28px 24px; }
  .sidebar-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.2; word-break: break-word; }
  .sidebar-title { font-size: 11px; color: #93C5FD; margin-bottom: 20px; }
  .sidebar-section { margin-bottom: 18px; }
  .sidebar-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #60A5FA; border-bottom: 1px solid #2D5A8E; padding-bottom: 5px; margin-bottom: 8px; }
  .sidebar-item { font-size: 11px; color: #DBEAFE; margin-bottom: 4px; word-break: break-all; }
  .skill-bar-wrap { margin-bottom: 6px; }
  .skill-bar-label { font-size: 11px; color: #DBEAFE; margin-bottom: 2px; }
  .skill-bar-bg { background: #2D5A8E; border-radius: 4px; height: 5px; }
  .skill-bar-fill { background: #60A5FA; border-radius: 4px; height: 5px; }
  .main-section-title { font-size: 14px; font-weight: 700; color: #1E3A5F; border-bottom: 2px solid #1E3A5F; padding-bottom: 4px; margin: 16px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .main-section-title:first-child { margin-top: 0; }
  .item { margin-bottom: 10px; }
  .item-row { display: flex; justify-content: space-between; align-items: baseline; }
  .item-title { font-weight: 700; font-size: 12px; color: #1E3A5F; }
  .item-subtitle { font-size: 11px; color: #475569; }
  .item-date { font-size: 10px; color: #94A3B8; white-space: nowrap; }
  .item-desc { font-size: 11px; color: #334155; margin-top: 3px; line-height: 1.6; }
  table.edu-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.edu-table th { background: #EFF6FF; font-weight: 700; padding: 5px 8px; border: 1px solid #BFDBFE; color: #1E3A5F; }
  table.edu-table td { padding: 5px 8px; border: 1px solid #DBEAFE; }
  .personal-grid { display: flex; flex-wrap: wrap; gap: 6px 20px; }
  .personal-item { font-size: 11px; min-width: 45%; }
  .personal-label { color: #475569; font-weight: 700; }
  .declaration-text { font-size: 11px; color: #334155; line-height: 1.6; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px; color: #475569; }
</style>
</head>
<body>
  <div class="sidebar">
    {% if photo_base64 %}
    <div style="text-align: center; margin-bottom: 16px;">
      <img src="{{ photo_base64 }}" style="width: 80px; height: 95px; object-fit: cover; border: 2px solid #93C5FD; border-radius: 4px;" />
    </div>
    {% endif %}
    <div class="sidebar-name">{{ name }}</div>
    {% if address %}<div class="sidebar-title">{{ address }}</div>{% endif %}

    <div class="sidebar-section">
      <div class="sidebar-section-title">Contact</div>
      {% if email %}<div class="sidebar-item">✉ {{ email }}</div>{% endif %}
      {% if phone %}<div class="sidebar-item">☎ {{ phone }}</div>{% endif %}
    </div>

    {% if skills and skills|length > 0 %}
    <div class="sidebar-section">
      <div class="sidebar-section-title">Skills</div>
      {% for skill in skills %}
      <div class="skill-bar-wrap">
        <div class="skill-bar-label">{{ skill }}</div>
        <div class="skill-bar-bg"><div class="skill-bar-fill" style="width: 75%;"></div></div>
      </div>
      {% endfor %}
    </div>
    {% endif %}

    {% if personal_details %}
    <div class="sidebar-section">
      <div class="sidebar-section-title">About Me</div>
      {% if personal_details.gender %}<div class="sidebar-item">Gender: {{ personal_details.gender }}</div>{% endif %}
      {% if personal_details.dob %}<div class="sidebar-item">DOB: {{ personal_details.dob }}</div>{% endif %}
      {% if personal_details.nationality %}<div class="sidebar-item">{{ personal_details.nationality }}</div>{% endif %}
      {% if personal_details.languages %}<div class="sidebar-item">{{ personal_details.languages }}</div>{% endif %}
      {% if personal_details.religion %}<div class="sidebar-item">{{ personal_details.religion }}</div>{% endif %}
    </div>
    {% endif %}
  </div>

  <div class="main">
    {% if objective %}
    <div class="main-section-title">Career Objective</div>
    <div class="item-desc" style="margin-bottom:8px;">{{ objective }}</div>
    {% endif %}

    {% if education and education|length > 0 %}
    <div class="main-section-title">Education</div>
    <table class="edu-table">
      <tr>
        <th>Qualification</th><th>Board/University</th><th>Year</th><th>%/CGPA</th>
      </tr>
      {% for edu in education %}
      <tr>
        <td>{{ edu.exam_name or edu.degree or '' }}</td>
        <td>{{ edu.board or edu.institution or '' }}</td>
        <td>{{ edu.year or '' }}</td>
        <td>{{ edu.cgpa or '' }}</td>
      </tr>
      {% endfor %}
    </table>
    {% endif %}

    {% if experience and experience|length > 0 %}
    <div class="main-section-title">Work Experience</div>
    {% for exp in experience %}
    <div class="item">
      <div class="item-row">
        <span class="item-title">{{ exp.title }}</span>
        <span class="item-date">{{ exp.duration }}</span>
      </div>
      <div class="item-subtitle">{{ exp.company }}</div>
      {% if exp.description %}<div class="item-desc">{{ exp.description }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if projects and projects|length > 0 %}
    <div class="main-section-title">Projects</div>
    {% for proj in projects %}
    <div class="item">
      <span class="item-title">{{ proj.name }}</span>
      {% if proj.description %}<div class="item-desc">{{ proj.description }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if certifications and certifications|length > 0 %}
    <div class="main-section-title">Certifications</div>
    {% for cert in certifications %}
    <div class="item">
      <div class="item-row">
        <span class="item-title">{{ cert.name }}</span>
        {% if cert.year %}<span class="item-date">{{ cert.year }}</span>{% endif %}
      </div>
      {% if cert.issuer %}<div class="item-subtitle">{{ cert.issuer }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if personal_details and personal_details.hobbies %}
    <div class="main-section-title">Hobbies</div>
    <div class="item-desc">{{ personal_details.hobbies }}</div>
    {% endif %}

    {% if declaration %}
    <div class="main-section-title">Declaration</div>
    <p class="declaration-text">{{ declaration }}</p>
    {% endif %}

    <div class="sign-row">
      <span>Date: ___________________</span>
      <span>{{ name }}</span>
    </div>
  </div>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────────────────
# Design 3: Minimalist Elegant — Clean serif-style, teal accent line
# ─────────────────────────────────────────────────────────────────────────────
RESUME_DESIGN_3 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; padding: 36px 40px; color: #1a1a1a; background: #fff; max-width: 820px; margin: 0 auto; font-size: 12px; }
  .header-name { font-size: 30px; font-weight: normal; color: #0F2940; letter-spacing: 2px; text-transform: uppercase; }
  .header-contact { display: flex; gap: 20px; font-size: 11px; color: #555; margin-top: 6px; flex-wrap: wrap; }
  .header-divider { width: 100%; height: 3px; background: linear-gradient(to right, #0D9488, transparent); margin: 14px 0 20px 0; }
  .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #0D9488; font-family: Arial, sans-serif; font-weight: 700; margin-bottom: 6px; margin-top: 20px; }
  .section-line { height: 1px; background: #E2E8F0; margin-bottom: 10px; }
  .item { margin-bottom: 10px; }
  .item-row { display: flex; justify-content: space-between; }
  .item-title { font-weight: bold; font-size: 12px; color: #0F2940; }
  .item-subtitle { font-size: 11px; color: #666; font-style: italic; }
  .item-date { font-size: 11px; color: #888; }
  .item-desc { font-size: 11px; color: #333; margin-top: 4px; line-height: 1.7; }
  .skills-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-dot { font-size: 11px; color: #0D9488; margin-right: 4px; }
  .skill-item { font-size: 11px; color: #334155; }
  table.edu-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.edu-table th { font-weight: 700; padding: 5px 8px; border-bottom: 1px solid #0D9488; color: #0F2940; text-align: left; }
  table.edu-table td { padding: 5px 8px; border-bottom: 1px solid #F1F5F9; color: #334155; }
  .personal-table { width: 100%; font-size: 11px; }
  .personal-table td:first-child { font-weight: bold; width: 150px; color: #555; padding: 3px 0; }
  .personal-table td:last-child { color: #1a1a1a; }
  .declaration-text { font-size: 11px; color: #444; line-height: 1.7; font-style: italic; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 28px; font-size: 11px; color: #666; }
</style>
</head>
<body>
  <table style="width: 100%; border: none;">
    <tr style="border: none;">
      <td style="border: none; padding: 0; vertical-align: middle;">
        <div class="header-name" style="text-align: left;">{{ name }}</div>
        <div class="header-contact" style="text-align: left;">
          {% if email %}<span>{{ email }}</span>{% endif %}
          {% if phone %}<span>{{ phone }}</span>{% endif %}
          {% if address %}<span>{{ address }}</span>{% endif %}
        </div>
      </td>
      {% if photo_base64 %}
      <td style="border: none; padding: 0; width: 85px; text-align: right; vertical-align: middle;">
        <img src="{{ photo_base64 }}" style="width: 75px; height: 85px; object-fit: cover; border: 1px solid #cbd5e1; border-radius: 4px;" />
      </td>
      {% endif %}
    </tr>
  </table>
  <div class="header-divider"></div>

  {% if objective %}
  <div class="section-title">Profile</div>
  <div class="section-line"></div>
  <div class="item-desc" style="margin-bottom:4px;">{{ objective }}</div>
  {% endif %}

  {% if education and education|length > 0 %}
  <div class="section-title">Education</div>
  <div class="section-line"></div>
  <table class="edu-table">
    <tr><th>Qualification</th><th>Board / University</th><th>Year</th><th>% / CGPA</th></tr>
    {% for edu in education %}
    <tr>
      <td>{{ edu.exam_name or edu.degree or '' }}</td>
      <td>{{ edu.board or edu.institution or '' }}</td>
      <td>{{ edu.year or '' }}</td>
      <td>{{ edu.cgpa or '' }}</td>
    </tr>
    {% endfor %}
  </table>
  {% endif %}

  {% if skills and skills|length > 0 %}
  <div class="section-title">Core Competencies</div>
  <div class="section-line"></div>
  <div class="skills-row">
    {% for skill in skills %}<span><span class="skill-dot">◆</span><span class="skill-item">{{ skill }}</span></span>{% endfor %}
  </div>
  {% endif %}

  {% if experience and experience|length > 0 %}
  <div class="section-title">Professional Experience</div>
  <div class="section-line"></div>
  {% for exp in experience %}
  <div class="item">
    <div class="item-row">
      <span class="item-title">{{ exp.title }}, {{ exp.company }}</span>
      <span class="item-date">{{ exp.duration }}</span>
    </div>
    {% if exp.description %}<div class="item-desc">{{ exp.description }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if certifications and certifications|length > 0 %}
  <div class="section-title">Certifications</div>
  <div class="section-line"></div>
  {% for cert in certifications %}
  <div class="item">
    <div class="item-row">
      <span class="item-title">{{ cert.name }}</span>
      {% if cert.year %}<span class="item-date">{{ cert.year }}</span>{% endif %}
    </div>
    {% if cert.issuer %}<div class="item-subtitle">{{ cert.issuer }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if projects and projects|length > 0 %}
  <div class="section-title">Projects</div>
  <div class="section-line"></div>
  {% for proj in projects %}
  <div class="item">
    <span class="item-title">{{ proj.name }}</span>
    {% if proj.description %}<div class="item-desc">{{ proj.description }}</div>{% endif %}
  </div>
  {% endfor %}
  {% endif %}

  {% if personal_details %}
  <div class="section-title">Personal Information</div>
  <div class="section-line"></div>
  <table class="personal-table">
    {% if personal_details.father_name %}<tr><td>Father's Name</td><td>{{ personal_details.father_name }}</td></tr>{% endif %}
    {% if personal_details.dob %}<tr><td>Date of Birth</td><td>{{ personal_details.dob }}</td></tr>{% endif %}
    {% if personal_details.gender %}<tr><td>Gender</td><td>{{ personal_details.gender }}</td></tr>{% endif %}
    {% if personal_details.nationality %}<tr><td>Nationality</td><td>{{ personal_details.nationality }}</td></tr>{% endif %}
    {% if personal_details.languages %}<tr><td>Languages</td><td>{{ personal_details.languages }}</td></tr>{% endif %}
    {% if personal_details.religion %}<tr><td>Religion</td><td>{{ personal_details.religion }}</td></tr>{% endif %}
    {% if personal_details.hobbies %}<tr><td>Hobbies</td><td>{{ personal_details.hobbies }}</td></tr>{% endif %}
  </table>
  {% endif %}

  {% if declaration %}
  <div class="section-title">Declaration</div>
  <div class="section-line"></div>
  <p class="declaration-text">{{ declaration }}</p>
  {% endif %}

  <div class="sign-row">
    <span>Date: ___________________</span>
    <span>{{ name }}</span>
  </div>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────────────────
# Design 4: Bold Creative — Dark navy header bar, colored skill tags, modern
# ─────────────────────────────────────────────────────────────────────────────
RESUME_DESIGN_4 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; color: #1a1a1a; background: #fff; font-size: 12px; }
  .hero { background: #111827; color: #fff; padding: 30px 36px; }
  .hero-name { font-size: 32px; font-weight: 900; letter-spacing: -1px; color: #fff; }
  .hero-contact { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
  .hero-contact span { font-size: 11px; color: #9CA3AF; }
  .hero-contact span b { color: #F59E0B; }
  .content { padding: 24px 36px; }
  .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #111827; margin: 20px 0 4px 0; display: flex; align-items: center; gap: 10px; }
  .section-title::after { content: ''; flex: 1; height: 2px; background: #F59E0B; }
  .objective-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px 14px; font-size: 12px; color: #374151; line-height: 1.6; margin-bottom: 4px; border-radius: 0 6px 6px 0; }
  .item { margin-bottom: 10px; }
  .item-row { display: flex; justify-content: space-between; align-items: center; }
  .item-title { font-weight: 800; font-size: 12px; color: #111827; }
  .item-subtitle { font-size: 11px; color: #6B7280; }
  .item-date { background: #F3F4F6; color: #374151; font-size: 10px; padding: 2px 8px; border-radius: 99px; }
  .item-desc { font-size: 11px; color: #374151; margin-top: 4px; line-height: 1.6; }
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: #111827; color: #F59E0B; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; }
  table.edu-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.edu-table th { background: #111827; color: #F59E0B; font-weight: 700; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
  table.edu-table tr:nth-child(even) { background: #F9FAFB; }
  table.edu-table td { padding: 6px 10px; border-bottom: 1px solid #E5E7EB; }
  .personal-grid { display: flex; flex-wrap: wrap; gap: 6px 24px; }
  .personal-item { min-width: 40%; font-size: 11px; color: #374151; padding: 3px 0; border-bottom: 1px dashed #E5E7EB; }
  .personal-item b { color: #111827; }
  .declaration-text { font-size: 11px; color: #6B7280; line-height: 1.6; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 24px; font-size: 11px; color: #9CA3AF; }
</style>
</head>
<body>
  <div class="hero">
    <table style="width: 100%; border: none;">
      <tr style="border: none;">
        <td style="border: none; padding: 0; vertical-align: middle; color: inherit;">
          <div class="hero-name" style="text-align: left; color: #F59E0B;">{{ name }}</div>
          <div class="hero-contact" style="text-align: left;">
            {% if email %}<span style="margin-right: 15px; color: #FFF;"><b>✉</b> {{ email }}</span>{% endif %}
            {% if phone %}<span style="margin-right: 15px; color: #FFF;"><b>☎</b> {{ phone }}</span>{% endif %}
            {% if address %}<span style="color: #FFF;"><b>⌂</b> {{ address }}</span>{% endif %}
          </div>
        </td>
        {% if photo_base64 %}
        <td style="border: none; padding: 0; width: 85px; text-align: right; vertical-align: middle;">
          <img src="{{ photo_base64 }}" style="width: 75px; height: 85px; object-fit: cover; border: 2px solid #F59E0B; border-radius: 4px;" />
        </td>
        {% endif %}
      </tr>
    </table>
  </div>

  <div class="content">
    {% if objective %}
    <div class="section-title">Objective</div>
    <div class="objective-box">{{ objective }}</div>
    {% endif %}

    {% if education and education|length > 0 %}
    <div class="section-title">Education</div>
    <table class="edu-table">
      <tr><th>Qualification</th><th>Board / University</th><th>Year</th><th>% / CGPA</th></tr>
      {% for edu in education %}
      <tr>
        <td>{{ edu.exam_name or edu.degree or '' }}</td>
        <td>{{ edu.board or edu.institution or '' }}</td>
        <td>{{ edu.year or '' }}</td>
        <td>{{ edu.cgpa or '' }}</td>
      </tr>
      {% endfor %}
    </table>
    {% endif %}

    {% if skills and skills|length > 0 %}
    <div class="section-title">Skills</div>
    <div class="skills-wrap">
      {% for skill in skills %}<span class="skill-tag">{{ skill }}</span>{% endfor %}
    </div>
    {% endif %}

    {% if experience and experience|length > 0 %}
    <div class="section-title">Experience</div>
    {% for exp in experience %}
    <div class="item">
      <div class="item-row">
        <span class="item-title">{{ exp.title }} — {{ exp.company }}</span>
        <span class="item-date">{{ exp.duration }}</span>
      </div>
      {% if exp.description %}<div class="item-desc">{{ exp.description }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if certifications and certifications|length > 0 %}
    <div class="section-title">Certifications</div>
    {% for cert in certifications %}
    <div class="item">
      <div class="item-row">
        <span class="item-title">{{ cert.name }}</span>
        {% if cert.year %}<span class="item-date">{{ cert.year }}</span>{% endif %}
      </div>
      {% if cert.issuer %}<div class="item-subtitle">{{ cert.issuer }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if projects and projects|length > 0 %}
    <div class="section-title">Projects</div>
    {% for proj in projects %}
    <div class="item">
      <span class="item-title">{{ proj.name }}</span>
      {% if proj.description %}<div class="item-desc">{{ proj.description }}</div>{% endif %}
    </div>
    {% endfor %}
    {% endif %}

    {% if personal_details %}
    <div class="section-title">Personal Details</div>
    <div class="personal-grid">
      {% if personal_details.father_name %}<div class="personal-item"><b>Father:</b> {{ personal_details.father_name }}</div>{% endif %}
      {% if personal_details.dob %}<div class="personal-item"><b>DOB:</b> {{ personal_details.dob }}</div>{% endif %}
      {% if personal_details.gender %}<div class="personal-item"><b>Gender:</b> {{ personal_details.gender }}</div>{% endif %}
      {% if personal_details.nationality %}<div class="personal-item"><b>Nationality:</b> {{ personal_details.nationality }}</div>{% endif %}
      {% if personal_details.languages %}<div class="personal-item"><b>Languages:</b> {{ personal_details.languages }}</div>{% endif %}
      {% if personal_details.religion %}<div class="personal-item"><b>Religion:</b> {{ personal_details.religion }}</div>{% endif %}
      {% if personal_details.hobbies %}<div class="personal-item"><b>Hobbies:</b> {{ personal_details.hobbies }}</div>{% endif %}
    </div>
    {% endif %}

    {% if declaration %}
    <div class="section-title">Declaration</div>
    <p class="declaration-text">{{ declaration }}</p>
    {% endif %}

    <div class="sign-row">
      <span>Date: ___________________</span>
      <span>{{ name }}</span>
    </div>
  </div>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────────────────
# Design 5: Traditional / Government — Pure formal, full-border table layout
# ─────────────────────────────────────────────────────────────────────────────
RESUME_DESIGN_5 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; padding: 30px 36px; color: #000; background: #fff; max-width: 820px; margin: 0 auto; font-size: 12px; }
  .top-border { border: 2px solid #000; padding: 12px; text-align: center; margin-bottom: 0; }
  h1.name { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
  .contact-line { font-size: 11px; margin-top: 4px; color: #333; }
  .outer-box { border: 2px solid #000; border-top: none; }
  .section-block { border-bottom: 1px solid #000; }
  .section-header { background: #D1D5DB; font-weight: 700; font-size: 12px; padding: 5px 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; }
  .section-body { padding: 8px 12px; }
  .objective-text { font-size: 12px; color: #000; line-height: 1.7; }
  table.main-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.main-table th { border: 1px solid #000; font-weight: 700; padding: 5px 8px; background: #F3F4F6; text-align: center; }
  table.main-table td { border: 1px solid #000; padding: 5px 8px; text-align: center; }
  table.main-table td:first-child { text-align: left; }
  .skills-list { list-style: disc; padding-left: 20px; font-size: 12px; color: #000; line-height: 1.8; }
  .personal-table { width: 100%; font-size: 12px; border-collapse: collapse; }
  .personal-table tr td { border: 1px solid #bbb; padding: 5px 10px; }
  .personal-table tr td:first-child { font-weight: 700; background: #F3F4F6; width: 45%; }
  .exp-item { margin-bottom: 8px; font-size: 12px; }
  .exp-item-title { font-weight: 700; }
  .exp-item-detail { color: #333; margin-top: 2px; line-height: 1.6; }
  .declaration-text { font-size: 12px; line-height: 1.7; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 18px; font-size: 12px; }
</style>
</head>
<body>
  <div class="top-border">
    <table style="width: 100%; border: none;">
      <tr style="border: none;">
        <td style="border: none; padding: 0; vertical-align: middle;">
          <h1 class="name" style="margin-bottom: 0;">Curriculum Vitae</h1>
          <div style="font-size:20px; font-weight:700; margin-top:6px;">{{ name }}</div>
          <div class="contact-line" style="margin-top: 6px;">
            {% if email %}{{ email }}{% endif %}
            {% if phone %} | {{ phone }}{% endif %}
            {% if address %} | {{ address }}{% endif %}
          </div>
        </td>
        {% if photo_base64 %}
        <td style="border: none; padding: 0; width: 85px; text-align: right; vertical-align: middle;">
          <img src="{{ photo_base64 }}" style="width: 75px; height: 85px; object-fit: cover; border: 1px solid #1e293b; border-radius: 4px;" />
        </td>
        {% endif %}
      </tr>
    </table>
  </div>

  <div class="outer-box">
    {% if objective %}
    <div class="section-block">
      <div class="section-header">Career Objective</div>
      <div class="section-body"><p class="objective-text">{{ objective }}</p></div>
    </div>
    {% endif %}

    {% if education and education|length > 0 %}
    <div class="section-block">
      <div class="section-header">Educational Qualifications</div>
      <div class="section-body">
        <table class="main-table">
          <tr>
            <th>Examination</th><th>Board / University</th><th>Year of Passing</th><th>% / CGPA</th>
          </tr>
          {% for edu in education %}
          <tr>
            <td>{{ edu.exam_name or edu.degree or '' }}</td>
            <td>{{ edu.board or edu.institution or '' }}</td>
            <td>{{ edu.year or '' }}</td>
            <td>{{ edu.cgpa or '' }}</td>
          </tr>
          {% endfor %}
        </table>
      </div>
    </div>
    {% endif %}

    {% if skills and skills|length > 0 %}
    <div class="section-block">
      <div class="section-header">Skills &amp; Competencies</div>
      <div class="section-body">
        <ul class="skills-list">
          {% for skill in skills %}<li>{{ skill }}</li>{% endfor %}
        </ul>
      </div>
    </div>
    {% endif %}

    {% if experience and experience|length > 0 %}
    <div class="section-block">
      <div class="section-header">Work Experience</div>
      <div class="section-body">
        {% for exp in experience %}
        <div class="exp-item">
          <div class="exp-item-title">{{ exp.title }} — {{ exp.company }} ({{ exp.duration }})</div>
          {% if exp.description %}<div class="exp-item-detail">{{ exp.description }}</div>{% endif %}
        </div>
        {% endfor %}
      </div>
    </div>
    {% endif %}

    {% if certifications and certifications|length > 0 %}
    <div class="section-block">
      <div class="section-header">Certifications / Courses</div>
      <div class="section-body">
        <table class="main-table">
          <tr><th>Course / Certificate</th><th>Issued By</th><th>Year</th></tr>
          {% for cert in certifications %}
          <tr>
            <td>{{ cert.name }}</td>
            <td>{{ cert.issuer or '' }}</td>
            <td>{{ cert.year or '' }}</td>
          </tr>
          {% endfor %}
        </table>
      </div>
    </div>
    {% endif %}

    {% if projects and projects|length > 0 %}
    <div class="section-block">
      <div class="section-header">Projects</div>
      <div class="section-body">
        {% for proj in projects %}
        <div class="exp-item">
          <div class="exp-item-title">{{ proj.name }}</div>
          {% if proj.description %}<div class="exp-item-detail">{{ proj.description }}</div>{% endif %}
        </div>
        {% endfor %}
      </div>
    </div>
    {% endif %}

    {% if personal_details %}
    <div class="section-block">
      <div class="section-header">Personal Details</div>
      <div class="section-body">
        <table class="personal-table">
          {% if personal_details.father_name %}<tr><td>Father's Name</td><td>{{ personal_details.father_name }}</td></tr>{% endif %}
          {% if personal_details.dob %}<tr><td>Date of Birth</td><td>{{ personal_details.dob }}</td></tr>{% endif %}
          {% if personal_details.gender %}<tr><td>Gender</td><td>{{ personal_details.gender }}</td></tr>{% endif %}
          {% if personal_details.nationality %}<tr><td>Nationality</td><td>{{ personal_details.nationality }}</td></tr>{% endif %}
          {% if personal_details.languages %}<tr><td>Languages Known</td><td>{{ personal_details.languages }}</td></tr>{% endif %}
          {% if personal_details.religion %}<tr><td>Religion</td><td>{{ personal_details.religion }}</td></tr>{% endif %}
          {% if personal_details.hobbies %}<tr><td>Hobbies</td><td>{{ personal_details.hobbies }}</td></tr>{% endif %}
        </table>
      </div>
    </div>
    {% endif %}

    {% if declaration %}
    <div class="section-block" style="border-bottom:none;">
      <div class="section-header">Declaration</div>
      <div class="section-body">
        <p class="declaration-text">{{ declaration }}</p>
        <div class="sign-row">
          <span>Date: ___________________</span>
          <span>Signature: ___________________</span>
          <span>{{ name }}</span>
        </div>
      </div>
    </div>
    {% else %}
    <div style="padding:10px 12px;">
      <div class="sign-row">
        <span>Date: ___________________</span>
        <span>{{ name }}</span>
      </div>
    </div>
    {% endif %}
  </div>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────────────────
# Design 6: Executive — Emerald green accent, clean premium professional look
# ─────────────────────────────────────────────────────────────────────────────
RESUME_DESIGN_6 = """
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; padding: 36px; color: #1a1a1a; background: #fff; max-width: 820px; margin: 0 auto; font-size: 12px; }
  .header { border-left: 6px solid #059669; padding-left: 18px; margin-bottom: 20px; }
  .header-name { font-size: 28px; font-weight: 900; color: #064E3B; letter-spacing: -0.5px; }
  .header-contact { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 8px; }
  .contact-chip { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #374151; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 3px 10px; border-radius: 99px; }
  .section-wrap { margin-top: 18px; }
  .section-title { font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
  .section-divider { height: 2px; background: linear-gradient(to right, #059669, #D1FAE5); margin-bottom: 10px; border-radius: 1px; }
  .objective-text { font-size: 12px; color: #374151; line-height: 1.7; background: #F0FDF4; padding: 10px 14px; border-radius: 6px; }
  .item { margin-bottom: 10px; padding-left: 14px; border-left: 2px solid #D1FAE5; }
  .item-row { display: flex; justify-content: space-between; align-items: center; }
  .item-title { font-weight: 800; font-size: 12px; color: #064E3B; }
  .item-subtitle { font-size: 11px; color: #059669; }
  .item-date { font-size: 10px; color: #6B7280; background: #F3F4F6; padding: 2px 8px; border-radius: 4px; }
  .item-desc { font-size: 11px; color: #374151; margin-top: 4px; line-height: 1.6; }
  .skills-row { display: flex; flex-wrap: wrap; gap: 7px; }
  .skill-tag { background: #ECFDF5; color: #065F46; font-size: 11px; padding: 4px 12px; border-radius: 6px; border: 1px solid #A7F3D0; font-weight: 600; }
  table.edu-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.edu-table th { background: #059669; color: #fff; font-weight: 700; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
  table.edu-table tr:nth-child(even) { background: #F0FDF4; }
  table.edu-table td { padding: 6px 10px; border-bottom: 1px solid #D1FAE5; }
  .personal-grid { display: flex; flex-wrap: wrap; gap: 6px 24px; }
  .personal-item { min-width: 44%; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #D1FAE5; }
  .personal-label { color: #059669; font-weight: 700; margin-right: 6px; }
  .cert-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .cert-table th { background: #059669; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
  .cert-table td { padding: 5px 8px; border-bottom: 1px solid #D1FAE5; }
  .declaration-text { font-size: 11px; color: #374151; line-height: 1.7; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 24px; font-size: 11px; color: #6B7280; }
</style>
</head>
<body>
  <div class="header">
    <table style="width: 100%; border: none;">
      <tr style="border: none;">
        <td style="border: none; padding: 0; vertical-align: middle;">
          <div class="header-name" style="text-align: left;">{{ name }}</div>
          <div class="header-contact" style="text-align: left;">
            {% if email %}<span class="contact-chip">✉ {{ email }}</span>{% endif %}
            {% if phone %}<span class="contact-chip">☎ {{ phone }}</span>{% endif %}
            {% if address %}<span class="contact-chip">⌂ {{ address }}</span>{% endif %}
          </div>
        </td>
        {% if photo_base64 %}
        <td style="border: none; padding: 0; width: 85px; text-align: right; vertical-align: middle;">
          <img src="{{ photo_base64 }}" style="width: 75px; height: 85px; object-fit: cover; border: 2px solid #059669; border-radius: 4px;" />
        </td>
        {% endif %}
      </tr>
    </table>
  </div>

  {% if objective %}
  <div class="section-wrap">
    <div class="section-title">Career Objective</div>
    <div class="section-divider"></div>
    <div class="objective-text">{{ objective }}</div>
  </div>
  {% endif %}

  {% if education and education|length > 0 %}
  <div class="section-wrap">
    <div class="section-title">Education</div>
    <div class="section-divider"></div>
    <table class="edu-table">
      <tr><th>Qualification</th><th>Board / University</th><th>Year</th><th>% / CGPA</th></tr>
      {% for edu in education %}
      <tr>
        <td>{{ edu.exam_name or edu.degree or '' }}</td>
        <td>{{ edu.board or edu.institution or '' }}</td>
        <td>{{ edu.year or '' }}</td>
        <td>{{ edu.cgpa or '' }}</td>
      </tr>
      {% endfor %}
    </table>
  </div>
  {% endif %}

  {% if skills and skills|length > 0 %}
  <div class="section-wrap">
    <div class="section-title">Skills</div>
    <div class="section-divider"></div>
    <div class="skills-row">
      {% for skill in skills %}<span class="skill-tag">{{ skill }}</span>{% endfor %}
    </div>
  </div>
  {% endif %}

  {% if experience and experience|length > 0 %}
  <div class="section-wrap">
    <div class="section-title">Work Experience</div>
    <div class="section-divider"></div>
    {% for exp in experience %}
    <div class="item">
      <div class="item-row">
        <span class="item-title">{{ exp.title }}</span>
        <span class="item-date">{{ exp.duration }}</span>
      </div>
      <div class="item-subtitle">{{ exp.company }}</div>
      {% if exp.description %}<div class="item-desc">{{ exp.description }}</div>{% endif %}
    </div>
    {% endfor %}
  </div>
  {% endif %}

  {% if certifications and certifications|length > 0 %}
  <div class="section-wrap">
    <div class="section-title">Certifications</div>
    <div class="section-divider"></div>
    <table class="cert-table">
      <tr><th>Certificate / Course</th><th>Issued By</th><th>Year</th></tr>
      {% for cert in certifications %}
      <tr>
        <td>{{ cert.name }}</td>
        <td>{{ cert.issuer or '' }}</td>
        <td>{{ cert.year or '' }}</td>
      </tr>
      {% endfor %}
    </table>
  </div>
  {% endif %}

  {% if projects and projects|length > 0 %}
  <div class="section-wrap">
    <div class="section-title">Projects</div>
    <div class="section-divider"></div>
    {% for proj in projects %}
    <div class="item">
      <span class="item-title">{{ proj.name }}</span>
      {% if proj.description %}<div class="item-desc">{{ proj.description }}</div>{% endif %}
    </div>
    {% endfor %}
  </div>
  {% endif %}

  {% if personal_details %}
  <div class="section-wrap">
    <div class="section-title">Personal Details</div>
    <div class="section-divider"></div>
    <div class="personal-grid">
      {% if personal_details.father_name %}<div class="personal-item"><span class="personal-label">Father:</span>{{ personal_details.father_name }}</div>{% endif %}
      {% if personal_details.dob %}<div class="personal-item"><span class="personal-label">DOB:</span>{{ personal_details.dob }}</div>{% endif %}
      {% if personal_details.gender %}<div class="personal-item"><span class="personal-label">Gender:</span>{{ personal_details.gender }}</div>{% endif %}
      {% if personal_details.nationality %}<div class="personal-item"><span class="personal-label">Nationality:</span>{{ personal_details.nationality }}</div>{% endif %}
      {% if personal_details.languages %}<div class="personal-item"><span class="personal-label">Languages:</span>{{ personal_details.languages }}</div>{% endif %}
      {% if personal_details.religion %}<div class="personal-item"><span class="personal-label">Religion:</span>{{ personal_details.religion }}</div>{% endif %}
      {% if personal_details.hobbies %}<div class="personal-item"><span class="personal-label">Hobbies:</span>{{ personal_details.hobbies }}</div>{% endif %}
    </div>
  </div>
  {% endif %}

  {% if declaration %}
  <div class="section-wrap">
    <div class="section-title">Declaration</div>
    <div class="section-divider"></div>
    <p class="declaration-text">{{ declaration }}</p>
  </div>
  {% endif %}

  <div class="sign-row">
    <span>Date: ___________________</span>
    <span>{{ name }}</span>
  </div>
</body>
</html>
"""

RESUME_TEMPLATES = {
    1: RESUME_DESIGN_1,
    2: RESUME_DESIGN_2,
    3: RESUME_DESIGN_3,
    4: RESUME_DESIGN_4,
    5: RESUME_DESIGN_5,
    6: RESUME_DESIGN_6,
}


class ResumeService:
    @staticmethod
    def generate_resume_pdf(data: dict) -> bytes:
        """Generate a PDF resume from structured JSON data."""
        design_id = data.get("design_id", 1) or 1
        template_html = RESUME_TEMPLATES.get(int(design_id), RESUME_DESIGN_1)
        template = Template(template_html)
        html_content = template.render(**data)

        try:
            from xhtml2pdf import pisa
            pdf_buffer = io.BytesIO()
            pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
            if pisa_status.err:
                raise RuntimeError("xhtml2pdf failed to generate PDF")
            return pdf_buffer.getvalue()
        except Exception as e:
            raise RuntimeError(f"Resume PDF generation failed: {e}")


class AgeCalculatorService:
    @staticmethod
    def calculate_age(dob: str, as_of_date: str = None) -> dict:
        """Calculate age from DOB to as_of_date (or today)."""
        dob_date = datetime.strptime(dob, "%Y-%m-%d").date()
        if as_of_date:
            ref_date = datetime.strptime(as_of_date, "%Y-%m-%d").date()
        else:
            ref_date = date.today()

        if ref_date < dob_date:
            return {"error": "Reference date is before date of birth"}

        years = ref_date.year - dob_date.year
        months = ref_date.month - dob_date.month
        days = ref_date.day - dob_date.day

        if days < 0:
            months -= 1
            prev_month = ref_date.month - 1 if ref_date.month > 1 else 12
            prev_year = ref_date.year if ref_date.month > 1 else ref_date.year - 1
            from calendar import monthrange
            days += monthrange(prev_year, prev_month)[1]

        if months < 0:
            years -= 1
            months += 12

        total_days = (ref_date - dob_date).days

        return {
            "years": years,
            "months": months,
            "days": days,
            "total_days": total_days,
            "dob": dob,
            "as_of_date": ref_date.isoformat(),
        }
