/* Original practice tasks by Academia Norteamericana; NOT ETS content or scoring. */
(function(root){
'use strict';
const img='../prototipos/exam_prep_lab/img/A/';
const schedule={title:'Professional Development Day — Thursday, May 14',rows:[
['9:00 a.m.','Registration','Main Lobby'],
['9:30 a.m.','Customer Support Strategies','Alma Rojas'],
['10:30 a.m.','Coffee Break','Lounge'],
['10:45 a.m.','Data Privacy Workshop','Teresa Moreno'],
['12:00 p.m.','Lunch','Cafeteria'],
['1:00 p.m.','Team Project Workshop','Main Hall']]};
const speaking=[
{id:'S01',n:1,type:'read',prepare:45,respond:45,prompt:'Good morning, everyone. Our customer service workshop will begin at nine thirty in Conference Room B. Please sign in at the registration table and collect your materials before taking a seat. We hope you enjoy today’s program.',criteria:['Pronunciation','Intonation and stress','Pace and clarity']},
{id:'S02',n:2,type:'read',prepare:45,respond:45,prompt:'Attention, passengers. The downtown shuttle will depart from the main entrance every twenty minutes until six this evening. If you need assistance with your luggage, please speak to a member of our transportation team.',criteria:['Pronunciation','Intonation and stress','Pace and clarity']},
{id:'S03',n:3,type:'picture',prepare:45,respond:30,image:img+'A-P1-02.svg',prompt:'Describe what you can see. Mention the people, objects, actions and location.',criteria:['Pronunciation','Grammar','Vocabulary','Cohesion']},
{id:'S04',n:4,type:'picture',prepare:45,respond:30,image:img+'A-P1-03.svg',prompt:'Describe what you can see. Use complete sentences and relevant details.',criteria:['Pronunciation','Grammar','Vocabulary','Cohesion']},
{id:'S05',n:5,type:'question',prepare:3,respond:15,prompt:'What type of transportation do you usually use to get to work or school?',criteria:['Relevance','Complete answer','Fluency']},
{id:'S06',n:6,type:'question',prepare:3,respond:15,prompt:'What time do you usually leave home, and why?',criteria:['Relevance','Complete answer','Fluency']},
{id:'S07',n:7,type:'question',prepare:3,respond:30,prompt:'What is one change that could make commuting easier in your city? Explain your reason.',criteria:['Relevance','Reasons and examples','Fluency']},
{id:'S08',n:8,type:'information',prepare:45,respond:15,information:schedule,prompt:'What time does the professional development event begin?',criteria:['Accuracy','Relevance','Clarity']},
{id:'S09',n:9,type:'information',prepare:3,respond:15,information:schedule,prompt:'Who will lead the data privacy workshop?',criteria:['Accuracy','Relevance','Clarity']},
{id:'S10',n:10,type:'information',prepare:3,respond:30,information:schedule,prompt:'I can only attend before noon. Could you describe the morning activities and their times?',criteria:['Accuracy','Completeness','Clarity']},
{id:'S11',n:11,type:'opinion',prepare:45,respond:60,prompt:'Should companies offer flexible working hours to their employees? State your opinion and support it with reasons and examples.',criteria:['Clear opinion','Reasons and examples','Organization','Grammar and vocabulary']}];
const sentence=(id,n,pic,words)=>({id,n,type:'sentence',minutes:8,image:img+pic,words,prompt:'Write ONE sentence about the illustration using BOTH required words. You may change word forms.',criteria:['Grammar','Both required words','Relevance']});
const writing=[
sentence('W01',1,'A-P1-03.svg',['woman','laptop']),
sentence('W02',2,'A-P1-02.svg',['place','box']),
sentence('W03',3,'A-P1-01.svg',['bicycles','entrance']),
sentence('W04',4,'A-P1-04.svg',['chairs','around']),
sentence('W05',5,'A-P1-05.svg',['water','flowers']),
{id:'W06',n:6,type:'email',minutes:10,email:{from:'Training Coordinator',subject:'New staff orientation',body:'Hello, We are planning an orientation for new employees next Wednesday. Could you confirm whether you are available? We would also appreciate two suggestions for topics that new employees should learn about. Thank you.'},prompt:'Write a professional reply. Confirm your availability, suggest TWO useful topics and explain why they matter.',criteria:['Task completion','Professional tone','Sentence variety','Vocabulary','Organization']},
{id:'W07',n:7,type:'email',minutes:10,email:{from:'Customer Support',subject:'Order delivery delay',body:'Dear team, My order was expected to arrive last Friday, but it has not been delivered. I need the materials for a meeting next week. Please let me know what happened and how you can help. Regards, Morgan Lee'},prompt:'Write a courteous response. Acknowledge the concern, propose a practical solution and explain the next steps without inventing a tracking number.',criteria:['Task completion','Professional tone','Sentence variety','Vocabulary','Organization']},
{id:'W08',n:8,type:'essay',minutes:30,prompt:'Which is more effective for employee development: online training or in-person training? State your opinion and support it with specific reasons and examples.',criteria:['Position and support','Relevant examples','Organization','Grammar','Vocabulary']}];
root.AN_FOUR_SKILLS_TASKS=Object.freeze({version:'pilot-2026-11-21',speaking,writing,original:true,disclaimer:'Formative practice. Not an ETS score or certification.'});
})(window);
