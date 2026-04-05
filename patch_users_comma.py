with open("backend/routes/users.py", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """
            cell_str = str(cell_value).strip()
            subject_text = cell_str
            classroom_text = None

            # If the cell has multiple lines, assume the last line might be the room number
            if '\\n' in cell_str:
                parts = [p.strip() for p in cell_str.split('\\n') if p.strip()]
                if len(parts) > 1:
                    subject_text = ' '.join(parts[:-1])
                    classroom_text = parts[-1]
"""

new_logic = """
            cell_str = str(cell_value).strip()
            subject_text = cell_str
            classroom_text = None
            section_text = None

            if ',' in cell_str:
                parts = [p.strip() for p in cell_str.split(',') if p.strip()]
                if len(parts) >= 3:
                    section_text = parts[0]
                    subject_text = parts[1]
                    classroom_text = parts[2]
                elif len(parts) == 2:
                    subject_text = parts[0]
                    classroom_text = parts[1]
            elif '\\n' in cell_str:
                parts = [p.strip() for p in cell_str.split('\\n') if p.strip()]
                if len(parts) > 1:
                    subject_text = ' '.join(parts[:-1])
                    classroom_text = parts[-1]

            if section_text:
                subject_text = f"{section_text} - {subject_text}"
"""

if old_logic.strip('\\n') in content:
    content = content.replace(old_logic.strip('\\n'), new_logic.strip('\\n'))
    with open("backend/routes/users.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced logic!")
else:
    print("Could not find old logic to replace.")
