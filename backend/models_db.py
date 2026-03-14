from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from database import Base

class PhishingAlert(Base):
    __tablename__ = "phishing_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    email_sender = Column(String, index=True, nullable=True) # Now optional
    url = Column(String, nullable=True) # New URL explicitly scanned
    details = Column(String)
    confidence = Column(Float)
    status = Column(String)
    timestamp = Column(DateTime)

class SpamStat(Base):
    __tablename__ = "spam_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    blocked_count = Column(Integer)
    junk_count = Column(Integer)
    timestamp = Column(DateTime)

class SystemAnomaly(Base):
    __tablename__ = "system_anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)
    severity = Column(String)
    timestamp = Column(DateTime)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    hash_match = Column(String, nullable=True)
    severity = Column(String)
    status = Column(String)
    timestamp = Column(DateTime)

class ScanReport(Base):
    __tablename__ = "scan_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    size_bytes = Column(Integer)
    status = Column(String)
    anomalies_detected = Column(Integer)
    details = Column(JSON) # Store the array of anomalies
    model_accuracy = Column(String)
    timestamp = Column(DateTime)
