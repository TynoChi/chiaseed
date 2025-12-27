import json

# Define the answers for ALL questions
answers = {
    # PileS1 (Previous)
    "ARF-PileS1-01": {"correctOptions": [1]},
    "ARF-PileS1-02": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-03": {"subQuestions": [1, 1, 1]},
    "ARF-PileS1-04": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-05": {"subQuestions": [2, 1]},
    "ARF-PileS1-06": {"subQuestions": [0, 0, 1]},
    "ARF-PileS1-07": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-08": {"correctOptions": [0]},
    "ARF-PileS1-09": {"correctOptions": [0, 2, 3]},
    "ARF-PileS1-10": {"subQuestions": [2, 2]},
    "ARF-PileS1-11": {"subQuestions": [0, 1, 0]},
    "ARF-PileS1-12": {"subQuestions": [2, 0]},
    "ARF-PileS1-13": {"subQuestions": [0, 1, 0]},
    "ARF-PileS1-14": {"correctOptions": [1, 2]},
    "ARF-PileS1-15": {"subQuestions": [1, 0, 1]},
    "ARF-PileS1-16": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-17": {"correctOptions": [0, 1, 2]},
    "ARF-PileS1-18": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-19": {"subQuestions": [0, 0]},
    "ARF-PileS1-20": {"subQuestions": [1, 1, 1]},
    "ARF-PileS1-21": {"correctOptions": [0]},
    "ARF-PileS1-22": {"correctOptions": [2]},
    "ARF-PileS1-23": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-24": {"correctOptions": [2, 3, 4]},
    "ARF-PileS1-25": {"subQuestions": [2, 1, 0]},
    "ARF-PileS1-26": {"subQuestions": [2, 1, 0]},
    "ARF-PileS1-27": {"correctOptions": [2]},
    "ARF-PileS1-28": {"correctOptions": [3]},
    "ARF-PileS1-29": {"correctOptions": [1, 2]},
    "ARF-PileS1-30": {"correctOptions": [0, 3]},
    "ARF-PileS1-31": {"correctOptions": [0, 3]},
    "ARF-PileS1-32": {"subQuestions": [2, 1]},
    "ARF-PileS1-33": {"subQuestions": [0, 0, 1]},
    
    # PileS2 (Previous + New)
    "ARF-PileS2-01": {"correctOptions": [0, 1]},
    "ARF-PileS2-02": {"correctOptions": [1, 2]},
    "ARF-PileS2-03": {"correctOptions": [1]},
    "ARF-PileS2-04": {"subQuestions": [0, 1]},
    "ARF-PileS2-05": {"correctOptions": [2]},
    "ARF-PileS2-06": {"correctOptions": [1, 2]},
    "ARF-PileS2-07": {"subQuestions": [1, 0, 0]},
    "ARF-PileS2-08": {"correctOptions": [1, 2, 3]},
    "ARF-PileS2-09": {"correctOptions": [0, 1, 2]},
    "ARF-PileS2-10": {"correctOptions": [1]},
    "ARF-PileS2-11": {"correctOptions": [3]},
    "ARF-PileS2-12": {"subQuestions": [0, 0, 0]},
    "ARF-PileS2-13": {"subQuestions": [0, 1, 1]},
    "ARF-PileS2-14": {"subQuestions": [1, 0, 0]},
    "ARF-PileS2-15": {"subQuestions": [1, 0, 1]},
    "ARF-PileS2-16": {"correctOptions": [0, 2, 3]},
    "ARF-PileS2-17": {"correctOptions": [1]},
    "ARF-PileS2-18": {"correctOptions": [3]},
    "ARF-PileS2-19": {"correctOptions": [2]},
    "ARF-PileS2-20": {"correctOptions": [0]},
    "ARF-PileS2-21": {"correctOptions": [0, 1, 3]},
    "ARF-PileS2-22": {"correctOptions": [1, 2]},
    "ARF-PileS2-23": {"correctOptions": [3]},
    "ARF-PileS2-24": {"subQuestions": [0, 0, 0]},
    "ARF-PileS2-25": {"subQuestions": [1, 2, 1]},
    "ARF-PileS2-26": {"subQuestions": [0, 0]},
    "ARF-PileS2-27": {"subQuestions": [1, 1]},
    "ARF-PileS2-28": {"subQuestions": [1, 0]},
    "ARF-PileS2-29": {"subQuestions": [0, 1, 1]},
    "ARF-PileS2-30": {"subQuestions": [0, 2]},
    "ARF-PileS2-31": {"correctOptions": [0, 1, 3]},
    "ARF-PileS2-32": {"correctOptions": [1]},
    "ARF-PileS2-33": {"correctOptions": [1]},
    "ARF-PileS2-34": {"correctOptions": [2]},
    "ARF-PileS2-35": {"subQuestions": [1, 0, 0]},
    "ARF-PileS2-36": {"subQuestions": [0, 1]},

    # PileS3 (New)
    "ARF-PileS3-01": {"correctOptions": [3]},
    "ARF-PileS3-02": {"correctOptions": [0, 1, 3]},
    "ARF-PileS3-03": {"subQuestions": [0, 0, 1]},
    "ARF-PileS3-04": {"subQuestions": [0, 0]},
    "ARF-PileS3-05": {"correctOptions": [0]},
    "ARF-PileS3-06": {"subQuestions": [2, 1, 0]},
    "ARF-PileS3-07": {"subQuestions": [2, 1, 0]},
    "ARF-PileS3-08": {"subQuestions": [2, 0]},
    "ARF-PileS3-09": {"correctOptions": [0]},
    "ARF-PileS3-10": {"correctOptions": [1, 2]},
    "ARF-PileS3-11": {"correctOptions": [0, 3]},
    "ARF-PileS3-12": {"correctOptions": [0, 2, 3]},
    "ARF-PileS3-13": {"correctOptions": [0, 1, 3]},
    "ARF-PileS3-14": {"subQuestions": [0, 1, 1]},
    "ARF-PileS3-15": {"correctOptions": [2]},
    "ARF-PileS3-16": {"correctOptions": [2]},
    "ARF-PileS3-17": {"correctOptions": [1]},
    "ARF-PileS3-18": {"correctOptions": [0]},
    "ARF-PileS3-19": {"correctOptions": [1]},
    "ARF-PileS3-20": {"subQuestions": [0, 2]},
    "ARF-PileS3-21": {"subQuestions": [0, 0, 1]},
    "ARF-PileS3-22": {"subQuestions": [0, 0, 1]},
    "ARF-PileS3-23": {"subQuestions": [1, 1]},
    "ARF-PileS3-24": {"correctOptions": [0, 2]},
    "ARF-PileS3-25": {"subQuestions": [1, 1, 0]},
    "ARF-PileS3-26": {"correctOptions": [2]},
    "ARF-PileS3-27": {"correctOptions": [0, 3]},
    "ARF-PileS3-28": {"correctOptions": [0]},
    "ARF-PileS3-29": {"subQuestions": [0, 1]},
    "ARF-PileS3-30": {"correctOptions": [0, 1]},
    "ARF-PileS3-31": {"correctOptions": [0, 2, 3]},
    "ARF-PileS3-32": {"correctOptions": [1, 3]},
    "ARF-PileS3-33": {"subQuestions": [0, 1, 1]},
    "ARF-PileS3-34": {"correctOptions": [1, 3]},
    "ARF-PileS3-35": {"correctOptions": [2, 3]},
    "ARF-PileS3-36": {"correctOptions": [0, 2]},
    "ARF-PileS3-37": {"correctOptions": [1, 2]},
    "ARF-PileS3-38": {"correctOptions": [2]},
    "ARF-PileS3-39": {"subQuestions": [1, 2]},
    "ARF-PileS3-40": {"correctOptions": [2, 3]},
    "ARF-PileS3-41": {"correctOptions": [2, 3]},
    "ARF-PileS3-42": {"correctOptions": [0, 1]},
    "ARF-PileS3-43": {"correctOptions": [1, 3]},
    "ARF-PileS3-44": {"subQuestions": [0, 0]},
    "ARF-PileS3-45": {"correctOptions": [2]},
    "ARF-PileS3-46": {"correctOptions": [0, 1]},
    "ARF-PileS3-47": {"correctOptions": [1]},
    "ARF-PileS3-48": {"correctOptions": [2]},
    "ARF-PileS3-49": {"correctOptions": [3]},
    "ARF-PileS3-50": {"correctOptions": [1]}
}

# Explanation Logic (Dictionary or Generator)
# To avoid excessive file size, I will use a generic but context-aware generator or simply hardcode meaningful texts for some and generic for others?
# User asked: "But in every question explaination show this message 'Answered & Explained by GenAI'"
# AND "only the text i require" -> implies meaningful text.
# I will use a lookup for explanations derived from my reasoning above.

explanations = {
    "ARF-PileS1-01": "Statements of 'To ensure...' typically describe a control objective.",
    "ARF-PileS1-02": "Small companies still need internal controls, though they may rely more on unsophisticated methods (e.g., owner oversight) and often struggle with segregation of duties due to limited staff.",
    "ARF-PileS1-03": "Bank reconciliations, budget comparisons, and supplier statement reconciliations are all detective controls as they identify errors after they have occurred.",
    "ARF-PileS1-04": "The audit committee monitors the external auditor's independence, the effectiveness of internal audit, and makes recommendations on appointment. Reviewing working papers is not a standard role.",
    "ARF-PileS1-05": "Restricting access is a physical control. Matching despatch records to orders is an information processing control.",
    "ARF-PileS1-06": "Training and passwords are general controls (environment). One-for-one checking is an application control (transaction level).",
    "ARF-PileS1-07": "Cyclical review of master files is an application control. Backup power and maintenance agreements are general controls supporting the IT infrastructure.",
    "ARF-PileS1-08": "Flowcharts are generally regarded as the most effective method for recording complex internal control systems and document flows.",
    "ARF-PileS1-09": "The components of internal control (CRIME) include Control Environment, Risk Assessment, and Control Activities (along with Information System and Monitoring). Strategy-devising is not a component.",
    "ARF-PileS1-10": "Both examples describe control activities (specifically information processing and authorisation).",
    "ARF-PileS1-11": "Collusion and management override are standard limitations of internal controls. Controls are typically designed for routine, not non-routine, transactions.",
    "ARF-PileS1-12": "Two teams counting inventory illustrates segregation of duties (or independent check). Chasing exceptions is a performance review.",
    "ARF-PileS1-13": "Inherent and control risks are components of audit risk. Identifying business risks is part of the entity's risk assessment.",
    "ARF-PileS1-14": "Segregation of duties helps prevent fraud and detects errors by ensuring no single individual controls all aspects of a transaction.",
    "ARF-PileS1-15": "Under the UK Corporate Governance Code, listed companies must establish an audit committee. It is part of the control environment and oversees both internal and external audit.",
    "ARF-PileS1-16": "The audit strategy includes preliminary materiality, budget/fee, and the timetable. Detailed procedures are in the audit plan.",
    "ARF-PileS1-17": "Understanding the entity helps identify risks, design procedures, and assess fraud risks. It is not primarily for future assignments.",
    "ARF-PileS1-18": "Analytical procedures involve comparing actual vs forecast, ratios vs industry, and budget vs actual. Bank reconciliation is a test of detail/control.",
    "ARF-PileS1-19": "A decrease in gross margin could be caused by increased cost of sales (e.g., sugar price) or reduced revenue (e.g., discounts).",
    "ARF-PileS1-20": "Materiality can be revised during the audit and includes qualitative factors, not just monetary. It requires professional judgement, not a fixed formula.",
    "ARF-PileS1-21": "If inherent and control risks are low, the auditor can rely on controls and reduce substantive procedures.",
    "ARF-PileS1-22": "If purchase invoices are not authorised, there is a risk that unauthorised payments will be made for goods/services not received or valid.",
    "ARF-PileS1-23": "Performance materiality is lower than overall materiality to provide a margin of safety. A lower level requires more work to detect misstatements.",
    "ARF-PileS1-24": "Risk identification procedures include inquiry, observation, and analytical procedures.",
    "ARF-PileS1-25": "First year audit increases detection risk. Internal audit reduces control risk. Listing intention increases inherent risk (bias).",
    "ARF-PileS1-26": "No previous experience increases detection risk. Lack of authorisation increases control risk. Profit-related pay increases inherent risk.",
    "ARF-PileS1-27": "Control risk is the risk that a material misstatement would not be prevented, detected, or corrected by the entity's internal control system.",
    "ARF-PileS1-28": "Professional scepticism involves a questioning mind and a critical assessment of audit evidence.",
    "ARF-PileS1-29": "A decrease in current ratio (Current Assets/Current Liabilities) could be caused by shifting to short-term debt (increasing CL) or adopting JIT (reducing Inventory/CA).",
    "ARF-PileS1-30": "An increase in gross margin could be caused by reducing discounts (higher effective price) or a change in sales mix to higher-margin products.",
    "ARF-PileS1-31": "Fast-moving industries (obsolescence) and legal claims (provisions) increase inherent risk.",
    "ARF-PileS1-32": "For an existing client with controls, a mix of tests of controls and substantive procedures is appropriate. For a review (limited assurance), substantive procedures (inquiry/analytical) are used.",
    "ARF-PileS1-33": "Intentional misstatement and theft are fraud. Unintentional mistakes (by unqualified staff) are error.",
    "ARF-PileS2-01": "Despatch not agreed to invoice risks completeness (unbilled sales). Unauthorised discounts risk valuation (incorrect revenue).",
    "ARF-PileS2-02": "Despatch records and sales invoices are the key documents for testing sales cut-off.",
    "ARF-PileS2-03": "Effective segregation involves recording by the assistant, review by the manager, and approval by the director.",
    "ARF-PileS2-04": "Unapproved suppliers risk inferior quality. Unchecked goods risk accepting items that do not meet requirements.",
    "ARF-PileS2-05": "Monthly comparisons between HR records and payroll are the best control to detect 'ghost' employees or leavers still being paid.",
    "ARF-PileS2-06": "Manual re-performance of calculations and reviewing the BACS list against payroll documentation are effective controls for accuracy.",
    "ARF-PileS2-07": "Documentation helps supervision and can be electronic. It is required by ISAs, not strictly 'law' in the same sense, though auditing standards have legal force in statutory audits.",
    "ARF-PileS2-08": "Permanent files contain long-term data like Mem & Arts, History, and Deeds. Management accounts and errors are current file items.",
    "ARF-PileS2-09": "Current files contain year-specific data like management accounts, error summaries, and representations.",
    "ARF-PileS2-10": "ICAEW requires retention for 6 years after the end of the accounting period.",
    "ARF-PileS2-11": "Working papers belong to the auditor. They may show them at their discretion if it does not prejudice the audit.",
    "ARF-PileS2-12": "Documentation enables QC reviews, provides evidence in disputes, and assists future audits.",
    "ARF-PileS2-13": "Working papers belong to the auditor. They are required by standards. They may be disclosed if required by law/regulators.",
    "ARF-PileS2-14": "Test data is auditor-created data run on client systems to test controls. Audit software runs on client data to reperform calculations.",
    "ARF-PileS2-15": "Analytical procedures are not typically tests of controls. They rely on data integrity. They can be performed by various staff levels.",
    "ARF-PileS2-16": "Reliability depends on source, relevance, and comparability.",
    "ARF-PileS2-17": "Sampling risk is the risk that the auditor's conclusion based on a sample may be different from the conclusion if the entire population were subjected to the same procedure.",
    "ARF-PileS2-18": "More efficient production techniques reduce the cost of sales, thereby increasing the gross margin.",
    "ARF-PileS2-19": "Tracing a physical asset to the register tests completeness (ensuring all assets are recorded).",
    "ARF-PileS2-20": "Trade receivables confirmations provide the strongest evidence for existence.",
    "ARF-PileS2-21": "Board minutes, solicitors' correspondence, and bank letters are key sources for identifying unrecorded or contingent liabilities.",
    "ARF-PileS2-22": "Using an independent estimate and reviewing subsequent events are the best methods to detect understatement of provisions.",
    "ARF-PileS2-23": "Random selection gives every item in the population an equal chance of selection.",
    "ARF-PileS2-24": "Non-statistical sampling is subjective. Statistical sampling involves random selection and allows for mathematical measurement of risk (confidence).",
    "ARF-PileS2-25": "Increasing tolerable misstatement or detection risk reduces sample size. Population size has negligible effect.",
    "ARF-PileS2-26": "Increasing expected misstatement or required confidence level increases sample size.",
    "ARF-PileS2-27": "Using other substantive procedures or stratifying the population allows for a smaller sample size.",
    "ARF-PileS2-28": "Increasing tolerable misstatement decreases sample size. Increasing audit risk increases sample size.",
    "ARF-PileS2-29": "Tolerable misstatement is the maximum error accepted. It is not a guide for management. Sampling risk is the risk the sample is not representative, not that actual exceeds expected.",
    "ARF-PileS2-30": "Computer generation is random selection. Every nth item is systematic selection.",
    "ARF-PileS2-31": "Board minutes provide evidence for contingent liabilities, commitments, and significant asset additions.",
    "ARF-PileS2-32": "Block sampling is appropriate for cut-off testing (allocating to correct period) by testing a block of items around the year-end.",
    "ARF-PileS2-33": "Monetary Unit Sampling (MUS) is most appropriate for testing overstatement of assets.",
    "ARF-PileS2-34": "Inspection of internal orders is the least persuasive as it is internally generated evidence. External and re-performance are stronger.",
    "ARF-PileS2-35": "Analytical procedures depend on system integrity. Observation is limited to the time it occurs. Confirmations may be biased towards agreeing understatements.",
    "ARF-PileS2-36": "Examining a deed is inspection. Watching a process is observation.",
    "ARF-PileS3-01": "If permission to contact the predecessor auditor is refused, the auditor should normally decline the appointment.",
    "ARF-PileS3-02": "Auditors should decline if permission to contact is refused (new or old) or if ethically barred. Outstanding fees are a threat but not an automatic bar unless significant.",
    "ARF-PileS3-03": "Falling prices/revenue and changing to cheaper suppliers (quality risk) increase inherent risk. Few unusual transactions is low risk.",
    "ARF-PileS3-04": "Increased raw material costs and early payment discounts (reducing revenue) both plausibly explain a decrease in gross margin.",
    "ARF-PileS3-05": "If risks are low, the strategy is to rely on controls and perform limited substantive procedures.",
    "ARF-PileS3-06": "New manager increases detection risk. Internal audit reduces control risk. Listing plans increase inherent risk.",
    "ARF-PileS3-07": "Most reliable is direct external evidence (Bank from Bank), then external held by client (Bank from Client), then internal (Aged Rec).",
    "ARF-PileS3-08": "Two teams counting is segregation of duties. Chasing exceptions is a performance review.",
    "ARF-PileS3-09": "Matching invoices with despatch notes ensures that all goods despatched are invoiced (completeness) and invoices are valid (occurrence).",
    "ARF-PileS3-10": "Despatch notes and sales invoices are the primary documents for testing sales cut-off.",
    "ARF-PileS3-11": "Routine tests and investigations are appropriate IA roles. Management responsibilities (filling roles) compromise independence.",
    "ARF-PileS3-12": "Preparing payroll, filling pay packets, and distributing wages should be segregated to prevent fraud.",
    "ARF-PileS3-13": "Board minutes, solicitors' letters, and bank letters are key for identifying unrecorded liabilities.",
    "ARF-PileS3-14": "Tolerable misstatement is the maximum accepted error. It is not for management use. Sampling risk is the risk of a non-representative sample.",
    "ARF-PileS3-15": "With non-responses, the auditor should continue efforts or perform alternative procedures. Simply accepting or passing to client is insufficient.",
    "ARF-PileS3-16": "Overdue fees create a self-interest threat. The firm should consider whether it is necessary to resign if the threat cannot be safeguarded.",
    "ARF-PileS3-17": "A key partner joining a listed client creates a significant threat. They should usually reject the offer or observe a cooling-off period.",
    "ARF-PileS3-18": "Key audit partners for listed entities must rotate after 5 years.",
    "ARF-PileS3-19": "An unsupervised trainee lacks competence for the task. They should refer the matter to the training partner.",
    "ARF-PileS3-20": "Tax services may be provided with safeguards (separate teams). Preparation of listed company accounts is prohibited (no safeguards).",
    "ARF-PileS3-21": "Acting for a competitor or advising on acquisition creates a conflict of interest. Interim reviews for the same client do not.",
    "ARF-PileS3-22": "Historical information and aggregation are inherent limitations. Auditors DO consider other information (ISA 720).",
    "ARF-PileS3-23": "Decreasing prices risks inventory overvaluation (NRV<Cost). Financial difficulty risks receivables not being recoverable.",
    "ARF-PileS3-24": "Physical verification confirms existence. Vouching to title deeds confirms rights.",
    "ARF-PileS3-25": "Board balance is weak (needs more NEDs). Share options compromise independence. IA reporting to Audit Committee is good governance.",
    "ARF-PileS3-26": "Experience as a Finance Director is an advantage. Family ties and performance fees are threats/disadvantages.",
    "ARF-PileS3-27": "Observing staff (Control test) and reviewing instructions (Control review) are tests of controls. Obsolescence and cut-off are substantive.",
    "ARF-PileS3-28": "Floor-to-sheet sample counts are the primary test for completeness of inventory records.",
    "ARF-PileS3-29": "Interviewing is Enquiry. Verifying signatures is Inspection.",
    "ARF-PileS3-30": "Enquiry about post-YE events and reviewing legal correspondence help identify missed estimates (e.g., provisions).",
    "ARF-PileS3-31": "Deferred income (Liability) assertions: Existence (obligation exists), Classification (current/non-current), Rights & Obligations.",
    "ARF-PileS3-32": "Access controls and encryption are key for preventing unauthorised data disclosure.",
    "ARF-PileS3-33": "Program logs are general controls. Manual checks and approval systems are application controls.",
    "ARF-PileS3-34": "Auditors assess strategy based on misstatements and must communicate all non-trivial misstatements to governance.",
    "ARF-PileS3-35": "Agreeing post-YE sales proceeds and confirming costs provides evidence for Net Realisable Value (NRV).",
    "ARF-PileS3-36": "Auditors should discuss with directors and determine the effect on the report if uncorrected. They cannot force adjustments.",
    "ARF-PileS3-37": "Inspecting containers on hand and tracing returns provides evidence of existence.",
    "ARF-PileS3-38": "Checking the numerical sequence helps ensure Completeness.",
    "ARF-PileS3-39": "Increasing tolerable misstatement decreases sample size. Small population changes have negligible effect.",
    "ARF-PileS3-40": "Auditors must ensure they have adequate resources and are professionally qualified/ethically able to act.",
    "ARF-PileS3-41": "Payroll objectives include ensuring correct tax is paid and employees are paid correct rates.",
    "ARF-PileS3-42": "Statistical sampling uses probability theory and random selection.",
    "ARF-PileS3-43": "Mispostings (no effect on total) and timing differences (not errors) are not extrapolated.",
    "ARF-PileS3-44": "WIP estimation and loan covenant pressures both increase Inherent Risk.",
    "ARF-PileS3-45": "Reviewing post year-end cashbook payments is a key test for understated (unrecorded) liabilities.",
    "ARF-PileS3-46": "Matching invoices to despatch notes ensures all despatched goods are invoiced (Completeness) and sales are valid (Occurrence).",
    "ARF-PileS3-47": "Statements defining desired outcomes (e.g., 'Cut-off is applied correctly') are Control Objectives.",
    "ARF-PileS3-48": "Investigation is a detective control, not a preventative one.",
    "ARF-PileS3-49": "If fees from a listed client exceed 15% for two years, a pre-issuance review is required.",
    "ARF-PileS3-50": "Overdue fees primarily create a self-interest threat (similar to a loan), though arguably intimidation if pressure is applied. The statement 'Intimidation threat exists' is considered False in strict terms of the primary threat."
}

file_path = 'json/new/ARF-02-B.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Handle both array and dictionary wrapper
questions = []
is_wrapper = False
if isinstance(data, list):
    questions = data
elif isinstance(data, dict) and 'entries' in data:
    questions = data['entries']
    is_wrapper = True

for q in questions:
    qid = q.get('id')
    if qid in answers:
        ans = answers[qid]
        
        # Add explanation if available
        if qid in explanations:
            q['explanation'] = "Answered & Explained by GenAI\n\n" + explanations[qid]
        else:
            q['explanation'] = "Answered & Explained by GenAI"

        if 'correctOptions' in ans:
            q['correctOptions'] = ans['correctOptions']
        
        if 'subQuestions' in ans and 'subQuestions' in q:
            for idx, sq in enumerate(q['subQuestions']):
                if idx < len(ans['subQuestions']):
                    sq['correctOption'] = ans['subQuestions'][idx]

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    if is_wrapper:
        data['entries'] = questions
        json.dump(data, f, indent=2)
    else:
        json.dump(questions, f, indent=2)

print(f"Updated {len(questions)} questions in {file_path}")
