from database import engine, Base, SessionLocal
from models_db import PhishingAlert, SpamStat, SystemAnomaly, SecurityAlert
from datetime import datetime, timedelta

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(SpamStat).first():
        print("Database already populated.")
        return
        
    print("Seeding database with initial data...")
    
    now = datetime.utcnow()
    
    # Seed Phishing
    p1 = PhishingAlert(
        email_sender="sender@phishmail.com",
        url="http://banking-update-verify.com",
        details="Malicious Link Detected (Trie + Levenshtein match)",
        confidence=0.998,
        status="Critical",
        timestamp=now - timedelta(minutes=5)
    )
    db.add(p1)
    
    # Seed Spam Stats (Just keeping one row for current overall stats)
    s1 = SpamStat(
        blocked_count=23,
        junk_count=187,
        timestamp=now
    )
    db.add(s1)
    
    # Seed Anomalies
    a1 = SystemAnomaly(type="Brute Force Attempt", severity="Medium", timestamp=now - timedelta(minutes=2))
    a2 = SystemAnomaly(type="Data Breach Detected", severity="High", timestamp=now - timedelta(minutes=12))
    a3 = SystemAnomaly(type="Suspicious Network Traffic", severity="Low", timestamp=now - timedelta(minutes=60))
    db.add_all([a1, a2, a3])
    
    # Seed Security Alerts
    sec1 = SecurityAlert(
        title="Malware Infection Detected",
        description="Hash: 8b1a...4f92 (Matched 10M DB, O(1) lookup)",
        severity="Critical",
        status="Action Required",
        timestamp=now - timedelta(minutes=1)
    )
    sec2 = SecurityAlert(
        title="Suspicious Login",
        description="IP: 192.168.1.45 (Anomalous Geo-location)",
        severity="Medium",
        status="Pending",
        timestamp=now - timedelta(minutes=10)
    )
    sec3 = SecurityAlert(
        title="Ransomware Activity",
        description="Process: encrypt.exe (PE header entropy spike)",
        severity="High",
        status="Pending",
        timestamp=now - timedelta(minutes=30)
    )
    db.add_all([sec1, sec2, sec3])
    
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    init_db()
