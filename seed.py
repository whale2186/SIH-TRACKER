import sqlite3
import json
import os

DB_PATH = os.getenv('SIH_DB_PATH', 'sih_tracker.db')
DATA_FILE = os.getenv('SIH_DATA_FILE', 'sih_2026_extracted.json')

def init_db(conn):
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_name TEXT NOT NULL,
            domain TEXT,
            problem_statement TEXT,
            mentor_name TEXT,
            college_name TEXT,
            team_lead TEXT,
            contact_email TEXT,
            status TEXT DEFAULT 'registered'
        )
    ''')
    conn.commit()

def load_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def seed_database():
    if not os.path.exists(DATA_FILE):
        print(f"Data file {DATA_FILE} not found.")
        return
    data = load_data(DATA_FILE)
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cursor = conn.cursor()
    inserted = 0
    for entry in data:
        cursor.execute('''
            INSERT INTO projects (project_name, domain, problem_statement, mentor_name, college_name, team_lead, contact_email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            entry.get('project_name'),
            entry.get('domain'),
            entry.get('problem_statement'),
            entry.get('mentor_name'),
            entry.get('college_name'),
            entry.get('team_lead'),
            entry.get('contact_email'),
            entry.get('status', 'registered')
        ))
        inserted += 1
    conn.commit()
    conn.close()
    print(f"Seeded {inserted} records into {DB_PATH}")

if __name__ == '__main__':
    seed_database()