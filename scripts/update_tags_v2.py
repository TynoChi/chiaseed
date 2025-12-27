import json
import os
import glob

# Mapping Dictionary (Old Tag -> New Tag)
# Based on the provided comparison between Old and New lists.
TAG_MAPPING = {
    # AREA 1: Concept, Process & Need
    "C01_Concept&Need": "#AREA1",
    "#ASSURANCE_CORE": "#AREA1",
    "AssuranceEngagement": "Assurance_Concept",
    "ElementsOfAssurance": "Assurance_Concept",
    "ThreeParties": "Three_Party_Relationship",
    "ReasonableAssurance": "Reasonable_vs_Limited",
    "LimitedAssurance": "Reasonable_vs_Limited",
    "LevelsOfAssurance": "Reasonable_vs_Limited",
    "ExpectationsGap": "Expectations_Gap",
    "StatutoryAudit": "Statutory_Audit_Exemptions", 
    "AuditExemption": "Statutory_Audit_Exemptions",
    "C02_ObtainingEngagement": "#AREA1",
    "#ENGAGEMENT_ACCEPT": "#AREA1",
    "ObtainingEngagement": "Engagement_Acceptance",
    "Tendering": "Engagement_Acceptance",
    "AcceptingEngagement": "Engagement_Acceptance",
    "ClientAcceptance": "Engagement_Acceptance",
    "Preconditions": "Preconditions_FAIF",
    "PreconditionsForAnAudit": "Preconditions_FAIF",
    "EngagementLetter": "Engagement_Letter_FORARMS",
    "TermsOfEngagement": "Engagement_Letter_FORARMS",
    "Materiality_Calc": "Materiality_Calculation",
    "#MATERIALITY": "#AREA1",
    "PerformanceMateriality": "Performance_Materiality",
    "DoubleMateriality_Plan": "Double_Materiality_Concept",
    "ProfessionalScepticism": "Professional_Scepticism",
    "ProfessionalJudgement": "Professional_Judgement",
    "Fraud": "Fraud_vs_Error",
    "Error": "Fraud_vs_Error",

    # AREA 2: Risk, Internal Controls, Info Flows
    "C03_Planning&Risk": "#AREA2", # Or AREA1 depending on context, but Risk is AREA2
    "#RISK_PLANNING": "#AREA2",
    "AuditRisk_Model": "Audit_Risk_Formula",
    "#AUDIT_RISK": "#AREA2",
    "InherentRisk": "Inherent_Risk",
    "ControlRisk": "Control_Risk",
    "DetectionRisk": "Detection_Risk",
    "BusinessRisk": "Business_Risk_Impact",
    "C05_InternalControl": "#AREA2",
    "#IC_COMPONENTS": "#AREA2",
    "ControlEnvironment": "Control_Environment",
    "RiskAssessmentProcess": "Risk_Assessment_Process",
    "InformationSystem": "Information_System",
    "MonitoringControls": "Monitoring_Controls",
    "#IC_CONTROLS": "#AREA2",
    "ControlActivities": "Existing_Control_Activities",
    "PreventiveControls": "Preventative_vs_Detective",
    "DetectiveControls": "Preventative_vs_Detective",
    "SegregationOfDuties": "Segregation_of_Duties",
    "SegregationOfDuties_Sales": "Segregation_of_Duties",
    "SegregationOfDuties_Purchases": "Segregation_of_Duties",
    "SegregationOfDuties_Payroll": "Segregation_of_Duties",
    "C06_RevenueSystem": "#AREA2",
    "#AUDIT_CYCLES": "#AREA2",
    "RevenueSystem_Sales": "Revenue_System_Flow",
    "SalesOrdering": "Revenue_System_Flow",
    "CreditControl": "Revenue_System_Flow",
    "GoodsDespatch": "Revenue_System_Flow",
    "Invoicing": "Revenue_System_Flow",
    "SalesRecording": "Revenue_System_Flow",
    "CashCollection": "Revenue_System_Flow",
    "RevenueRisks": "Revenue_System_Flow",
    "RevenueControls": "Revenue_System_Flow",
    "RevenueDeficiencies": "Revenue_System_Flow",
    "C07_PurchasesSystem": "#AREA2",
    "PurchasesSystem_Payables": "Purchases_System_Flow",
    "PurchaseOrdering": "Purchases_System_Flow",
    "GoodsReceivedNotes": "Purchases_System_Flow",
    "PurchaseInvoiceRecording": "Purchases_System_Flow",
    "Payments": "Purchases_System_Flow",
    "PurchasesRisks": "Purchases_System_Flow",
    "PurchasesControls": "Purchases_System_Flow",
    "C08_EmployeeCosts": "#AREA2",
    "PayrollSystem_EmpCosts": "Payroll_System_Flow",
    "CalculatingWages": "Payroll_System_Flow",
    "RecordingPayroll": "Payroll_System_Flow",
    "PayingWages": "Payroll_System_Flow",
    "PayrollRisks": "Payroll_System_Flow",
    "PayrollControls": "Payroll_System_Flow",
    "WalkthroughProcedures": "Walkthrough_Procedures",
    "C09_InternalAudit": "#AREA2",
    "#INTERNAL_AUDIT": "#AREA2",
    "InternalAuditFunction": "IA_Function_Role",
    "RoleOfInternalAudit": "IA_Function_Role",
    "IAvsExternal": "IA_vs_External_Audit",
    "IA_Independence": "IA_Independence",

    # AREA 3: Obtaining Assurance Evidence
    "C04_Evidence&Reporting": "#AREA3",
    "#EVIDENCE_PROCEDURES": "#AREA3",
    "AuditEvidence": "Reliability_Hierarchy",
    "SufficientAppropriate": "Reliability_Hierarchy",
    "ReliabilityOfEvidence": "Reliability_Hierarchy",
    "#ASSERTIONS": "#AREA3",
    "FinancialStatementAssertions": "Assertions_PACC_CO", # Mapping generally
    "Occurrence": "Assertions_PACC_CO",
    "Completeness": "Assertions_PACC_CO",
    "Accuracy": "Assertions_PACC_CO",
    "CutOff": "Assertions_PACC_CO",
    "Classification": "Assertions_PACC_CO",
    "Presentation": "Assertions_PACC_CO",
    "Existence": "Assertions_CVP_RE",
    "RightsAndObligations": "Assertions_CVP_RE",
    "Valuation": "Assertions_CVP_RE",
    "AnalyticalProcedures_Plan": "Analytical_Procedures",
    "AnalyticalProcedures_Sub": "Analytical_Procedures",
    "DataAnalytics": "Audit_Data_Analytics_ADA",
    "Inquiry": "Enquiry",
    "Inspection": "Inspection",
    "Observation": "Observation",
    "Recalculation": "recalcUlation_reperformance",
    "Reperformance": "recalcUlation_reperformance",
    "ExternalConfirmation": "Confirmation",
    "ExternalConfirmation_Rec": "Confirmation",
    "BankConfirmation": "Confirmation",
    "C11_Evidence&Sampling": "#AREA3",
    "#SAMPLING": "#AREA3",
    "SamplingRisk": "Sampling_Risk",
    "AuditSampling": "Statistical_vs_NonStatistical",
    "MonetaryUnitSampling": "MUS_Monetary_Unit_Sampling",
    "MonetaryUnitSampling_MUS": "MUS_Monetary_Unit_Sampling",
    "C12_Representations": "#AREA3",
    "#REPRESENTATIONS": "#AREA3",
    "WrittenRepresentations": "Written_Representations_ISA580",
    "ManagementReps": "Written_Representations_ISA580",
    "LetterOfRepresentation": "Written_Representations_ISA580",
    "ISA580": "Written_Representations_ISA580",
    "#REPORTING": "#AREA3",
    "AuditorsReport": "Modified_Opinion", # Assumption based on context
    "AuditOpinion": "Modified_Opinion",
    "ModifiedOpinion": "Modified_Opinion",
    "KAM": "KAM_Key_Audit_Matters",
    "C13_SubstantiveProcedures": "#AREA3",
    "#SUBSTANTIVE_ACCOUNTS": "#AREA3",

    # AREA 4: Ethics and Regulation
    "C14_Ethics&Regs": "#AREA4",
    "#ETHICS_FUNDAMENTALS": "#AREA4",
    "PrinciplesBased": "Principles_vs_Rules",
    "RulesBased": "Principles_vs_Rules",
    "FundamentalPrinciples": "BOCIP_Fundamental_Principles",
    "Integrity": "BOCIP_Fundamental_Principles",
    "Objectivity": "BOCIP_Fundamental_Principles",
    "ProfessionalCompetenceAndDueCare": "BOCIP_Fundamental_Principles",
    "Confidentiality": "BOCIP_Fundamental_Principles",
    "ProfessionalBehaviour": "BOCIP_Fundamental_Principles",
    "C15_Independence": "#AREA4",
    "#ETHICAL_THREATS": "#AREA4",
    "EthicalThreats": "Ethical_Threats",
    "SelfInterestThreat": "Self_Interest",
    "SelfReviewThreat": "Self_Review",
    "AdvocacyThreat": "Advocacy",
    "FamiliarityThreat": "Familiarity",
    "IntimidationThreat": "Intimidation",
    "ManagementThreat": "Management_Threat",
    "#INDEPENDENCE": "#AREA4",
    "EthicalSafeguards": "Ethical_Safeguards",
    "C16_Confidentiality": "#AREA4",
    "#CONFIDENTIALITY": "#AREA4",
    "DataProtection_GDPR": "Confidentiality_GDPR",
    "UK_GDPR": "Confidentiality_GDPR",
    "MoneyLaundering": "Money_Laundering_POCA",
    "MoneyLaundering_POCA": "Money_Laundering_POCA",
    "MLRO": "MLRO_Tipping_Off",
    "TippingOff": "MLRO_Tipping_Off",
    "ISSB": "ISSB_Role_Aims",
    "IFRSS1/IFRSS2": "IFRS_S1_General", # Splitting isn't easy, mapping to General
    "ISSA5000": "ISSA_5000_Standard",

    # Specialized Integration (Tech & Modern)
    "#TECH_MODERN": "#TECH_MODERN",
    "Cybersecurity": "Cyber_Data_Security",
    "ArtificialIntelligence": "RPA_AI_Blockchain",
    "RPA": "RPA_AI_Blockchain",
    "Blockchain": "RPA_AI_Blockchain",
    "RemoteAuditing": "Remote_Auditing_Techniques",
    "PhysicalRisks": "Physical_vs_Transition_Risks",
    "TransitionRisks": "Physical_vs_Transition_Risks",
    "ESG": "ESG_Assurance",
    "SustainabilityReporting": "ESG_Assurance"
}

def update_files():
    # Target files in json/new/ matching ARF-02-*.json
    files = glob.glob('json/new/ARF-02-*.json')
    
    if not files:
        print("No files found matching json/new/ARF-02-*.json")
        return

    for file_path in files:
        print(f"Processing {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Data can be a list or a dict with "entries"
            entries = []
            is_dict_wrapper = False
            
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict) and 'entries' in data:
                entries = data['entries']
                is_dict_wrapper = True
            else:
                print(f"  Skipping: Unknown JSON structure in {file_path}")
                continue

            updated_count = 0
            for entry in entries:
                original_tags = entry.get('tags', [])
                new_tags_to_add = set()
                
                for tag in original_tags:
                    # Direct match
                    if tag in TAG_MAPPING:
                        new_tags_to_add.add(TAG_MAPPING[tag])
                    else:
                        # Case insensitive match attempt?
                        # Or partial match? For now, stick to exact or defined keys
                        pass
                
                # Filter out tags that are already present
                final_new_tags = [t for t in new_tags_to_add if t not in original_tags]
                
                if final_new_tags:
                    entry['tags'] = original_tags + final_new_tags
                    updated_count += 1
            
            # Save back
            if updated_count > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    if is_dict_wrapper:
                        data['entries'] = entries
                        json.dump(data, f, indent=2)
                    else:
                        json.dump(entries, f, indent=2)
                print(f"  Updated {updated_count} questions in {file_path}")
            else:
                print("  No tags updated.")

        except Exception as e:
            print(f"  Error processing {file_path}: {e}")

if __name__ == "__main__":
    update_files()
