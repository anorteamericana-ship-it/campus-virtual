// F111 R65 · Banco de cuestionarios digitales B1 Quiz 4–8.
// Fuente institucional: Cambridge Interchange 5ª edición Intro, Units 7–16 Quiz.
// La clave de respuestas y los guiones NO se incluyen aquí; solo docente autenticado puede consultarlos.
// IDs de respuesta: idénticos a F111_QZ_SECTIONS_B1 del CORE QUIZ @510.
// "G" en PC04 es una sola respuesta multiopción (3 afirmaciones), como exige el esquema.
(function(){
'use strict';
const banks={
16:{number:4,units:'7–8',sections:[
{id:'A',title:'Listening · Julia’s new house',points:3,type:'radio',help:'Escuchá a Julia describiendo su nueva casa. Elegí la palabra correcta (3 puntos).',items:[
['A1','There are two _____.',['bedrooms','bathrooms','closets']],
['A2','There are some chairs in the _____.',['dining room','kitchen','living room']],
['A3','Julia needs a _____ for the kitchen.',['microwave oven','refrigerator','stove']]
]},
{id:'B',title:'Simple present in a conversation',points:4,type:'text',help:'Usá el presente simple de live y have. Completá preguntas y respuestas (4 respuestas; cada pregunta puede contener más de un espacio).',items:[
['B1a','A: _____ you _____ (live) alone? · Escribí la pregunta completa.'],
['B1b',"B: No, I _____. · Escribí la respuesta corta."],
['B2a','A: _____ your apartment building _____ (have) an elevator? · Escribí la pregunta completa.'],
['B2b',"B: Yes, it _____. · Escribí la respuesta corta."]
]},
{id:'C',title:'Unscramble the sentences',points:3,type:'text',help:'Ordená las palabras para construir oraciones completas.',items:[
['C1','(the / there / a / isn’t / mirror / in / bedroom)'],
['C2','(no / pictures / the / living room / are / there / in)'],
['C3','(in / there / any / aren’t / the / curtains / dining room)']
]},
{id:'D',title:'Write questions',points:3,type:'text',help:'Escribí la pregunta adecuada para cada respuesta.',items:[
['D1',"B: I work in a restaurant."],
['D2',"B: He's a firefighter."],
['D3',"B: They don't really like their jobs."]
]},
{id:'E',title:'Jobs · correct words',points:3,type:'radio',help:'Seleccioná la palabra correcta.',items:[
['E1','A _____ doesn’t wear a uniform.',['police officer','security guard','plumber']],
['E2','A _____ works in a hospital.',['nurse','bellhop','salesperson']],
['E3','A _____ sits at a desk.',['taxi driver','receptionist','painter']]
]},
{id:'F',title:'Be / Have + adjectives',points:6,type:'text',help:'Completá con el presente simple de be o have y el adjetivo entre paréntesis. Usá a/an cuando sea necesario.',items:[
['F1a','A: A video game designer _____ (exciting) job.'],
['F1b',"B: I disagree. I think a video game designer's job _____ (boring)."],
['F2a','A: A police officer _____ (dangerous) job.'],
['F2b',"B: I agree. It _____ (stressful), too."],
['F3a',"A: A cashier’s job _____ (easy)."],
['F3b',"B: I disagree. A cashier _____ (difficult) job."]
]},
{id:'G',title:'Reading · Fred’s jobs',points:3,type:'multi',maxSelections:3,help:'Leé la entrevista y elegí exactamente TRES afirmaciones verdaderas. Es una respuesta grupal de 3 puntos.',
reading:"REPORTER: Fred, where do you work?\nFRED: Well, I have two jobs. First, I work in a hospital.\nREPORTER: Really? What do you do there?\nFRED: I’m a nurse. I take care of patients.\nREPORTER: Do you like it?\nFRED: Yes. My salary isn’t great, but that’s OK. I like my patients, so I’m happy.\nREPORTER: And where else do you work?\nFRED: I work in a restaurant at night.\nREPORTER: How do you like it?\nFRED: It’s an interesting job, but I work a lot of hours. I get tired!",
items:[['G','Which THREE statements are true?',['Fred is a doctor in a hospital.','Fred makes a lot of money.','Fred works in a restaurant.','Fred’s jobs are boring.','Fred likes his jobs.','Fred works at night.']]]
}
]},
21:{number:5,units:'9–10',sections:[
{id:'A',title:'Listening · Frequency adverbs',points:3,type:'select',help:'Escuchá y elegí el adverbio de frecuencia correcto. No se usan todos.',matchOptions:[['always','always'],['usually','usually'],['often','often'],['sometimes','sometimes'],['hardly ever','hardly ever'],['never','never']],items:[
['A1','Steve eats a salad and some fruit for lunch.'],
['A2','Amy eats late on Thursdays.'],
['A3','Frank puts sugar in his coffee.']
]},
{id:'B',title:'Articles and determiners',points:6,type:'text',help:'Completá con a, an, some o any.',items:[
['B1',"Lisa: Let’s see. We need _____ cereal."],
['B2','Tom: Do we have _____ eggs?'],
['B3',"Lisa: No, we don’t. Let’s get _____."],
['B4','Tom: And do we have _____ fruit?'],
['B5',"Lisa: Let’s buy _____ orange."],
['B6','Lisa: And _____ banana.']
]},
{id:'C',title:'Unscramble the questions',points:4,type:'text',help:'Ordená las palabras y escribí preguntas completas.',items:[
['C1','(eat / you / what / time / do / dinner / usually)'],
['C2','(something / you / never / what’s / dinner / have / for)'],
['C3','(ever / family / have / for / fish / breakfast / your / does)'],
['C4','(lunch / always / do / hamburgers / for / they / eat)']
]},
{id:'D',title:'Wh-questions and sports',points:3,type:'text',help:'Usá las palabras sugeridas para escribir preguntas.',items:[
['D1','(sports / play) · B: I play soccer and tennis.'],
['D2','(play / soccer) · B: I play soccer with my school team.'],
['D3','(your team / practice) · B: We practice five days a week.']
]},
{id:'E',title:'Can / Can’t · Abilities',points:6,type:'text',help:'Completá con can/can’t y las expresiones: bake a cake, tell good jokes, upload photos, fix a car, play chess, skateboard. No se usan todas.',items:[
['E1a','A: _____ you _____? · B: Yes, I can. I really love to go fast. Escribí la pregunta completa.'],
['E1b',"B: Yes, I _____. · Completa la respuesta corta."],
['E2a',"A: _____ Brittany _____? · B: No, she can’t. She’s not very funny. Escribí la pregunta completa."],
['E2b','B: No, she _____. · Completa la respuesta corta.'],
['E3a',"A: _____ Carlos _____? · B: Yes, he can. He’s a very good cook. Escribí la pregunta completa."],
['E3b','B: Yes, he _____. · Completa la respuesta corta.']
]},
{id:'F',title:'Reading · Community Center',points:3,type:'multi',maxSelections:2,help:'Leé el aviso. Seleccioná exactamente DOS respuestas para cada pregunta.',
reading:"Come to Rivervale Community Center!\nDo you like to learn new languages? Spanish and French language classes are starting. Do you need a new hobby? Maybe our photography or painting class is for you. Can’t cook? Try our Chinese cooking class. All classes begin next week.\nDo you enjoy sports or need some exercise? The swimming pool is open every day. Play basketball or volleyball in the gym in the evenings. And on Saturdays, we have hiking trips!\nThe RCC Community Center is for people of all ages – from 9 to 90! We’re open Monday to Saturday from 8:00 A.M. to 10 P.M. Come in and check us out!",
items:[
['F1','What classes can you take?',['language classes','furniture design','French cooking','photography']],
['F2','What sports can you play or do?',['soccer','basketball','golf','swimming']],
['F3','When is the community center open?',['9:00 A.M. to 9:00 P.M.','every day','8:00 A.M. to 10:00 P.M.','Monday to Saturday']]
]}
]},
24:{number:6,units:'11–12',sections:[
{id:'A',title:'Listening · Birthday party',points:3,type:'radio',help:'Escuchá la conversación y elegí las respuestas correctas.',items:[
['A1','Mark is going to be _____.',['13 years old','30 years old','33 years old']],
['A2',"They’re going to have a party on _____.",['Friday','Saturday','Sunday']],
['A3',"They’re going to _____ at the party.",['dance','sing songs','watch television']]
]},
{id:'B',title:'Going to · Match questions',points:6,type:'select',help:'Relacioná cada pregunta con una respuesta (a–f).',
matchOptions:[
['a',"Yes, I am. I’m going to go swimming."],
['b',"No, it’s not. It’s going to be sunny."],
['c',"No, we’re not. We’re going to relax."],
['d',"Yes, they are. They’re going to make pasta."],
['e',"Yes, he is. He’s going to visit his parents."],
['f',"No, she’s not. She’s going to go to a party."]
],items:[
['B1','Are we going to work this weekend?'],
['B2','Are they going to cook dinner?'],
['B3','Are you going to do anything this evening?'],
['B4','Is Bill going to do anything after work?'],
['B5','Is Pam going to go on a picnic this weekend?'],
['B6','Is it going to rain tomorrow?']
]},
{id:'C',title:'Future Wh-questions',points:4,type:'text',help:'Escribí las preguntas en futuro con be going to.',items:[
['C1',"B: Next winter? We’re going to go to Aruba."],
['C2',"B: We’re going to take a boat."],
['C3',"B: I’m going to go with my family."],
['C4',"B: We’re going to go on January 21st."]
]},
{id:'D',title:'Medication advice',points:4,type:'select',help:'Completá con las palabras del banco: drink, feel, give, have, hurt, take. No se usan todas.',
matchOptions:[['drink','drink'],['feel','feel'],['give','give'],['have','have'],['hurt','hurt'],['take','take']],
items:[
['D1','A: I have a headache. B: _____ these pills with some water.'],
['D2',"A: What’s the matter? B: I don’t feel well. I _____ a stomachache."],
['D3',"A: How do you feel today? B: Not so good. My eyes are dry, and they _____."],
['D4',"A: I have a bad cough. B: That’s too bad. I’m going to _____ you some cough syrup."]
]},
{id:'E',title:'Match the medications',points:4,type:'select',help:'Relacioná cada medicamento ilustrado con la conversación correspondiente del apartado D (1 a 4).',
displayCards:[
['a','🧴','Cough syrup'],['b','💊','Aspirin pills'],
['c','🧴','Antacid'],['d','💧','Eye drops']
],matchOptions:[['1','Conversación 1'],['2','Conversación 2'],['3','Conversación 3'],['4','Conversación 4']],
items:[
['E1','a · Cough syrup'],['E2','b · Aspirin pills'],['E3','c · Antacid'],['E4','d · Eye drops']
]},
{id:'F',title:'Reading · Home Remedies',points:4,type:'text',help:'Leé el artículo y escribí la palabra o expresión que corrige el error de cada oración.',
reading:"HOME REMEDIES\nDo home remedies really work? Many people say yes. Try these easy home remedies.\nA Cold: What can you do for a cold? Many people eat hot chicken soup. Other people drink hot tea with lemon.\nA Backache: Rest on your back for two to four hours. Don’t use your back and shoulders to lift things. To help your backache, try yoga.\nA Headache: What about a headache? Put a cold cloth on your head, or put cold water on your face. You can also put your hands in hot water. This can help.\nInsomnia: Can’t sleep at night? Drink a large glass of warm milk, or take a very warm bath before you go to bed.",
items:[
['F1','For a cold, try hot lemon soup.'],
['F2','For a backache, rest on your stomach for a few hours.'],
['F3','For a headache, put hot water on your face.'],
['F4','For insomnia, drink warm tea or take a warm bath.']
]}
]},
28:{number:7,units:'13–14',sections:[
{id:'A',title:'Listening · Directions and shopping',points:4,type:'radio',help:'Escuchá a Helen y Mark. Elegí la respuesta correcta.',items:[
['A1','Where are Helen and Mark going?',['A bank and a department store.','A bank and a gas station.','A gas station and a department store.']],
['A2',"Where is Smith’s Department Store?",['On Second Street.','On the corner of First and Main.','On Main, between First and Second.']],
['A3','How can they get there?',['They can walk up Second to Main and turn left.','They can walk up Second to First and turn right.','They can walk up Second to Main and turn right.']],
['A4','What is Mark going to buy?',['A sweatshirt.','A tie.','A sweater.']]
]},
{id:'B',title:'Prepositions · City map',points:4,type:'select',help:'Observá el plano esquemático y elegí la preposición correcta.',
diagram:'PC07_CITY_MAP',matchOptions:[['across from','across from'],['between','between'],['next to','next to'],['on the corner of','on the corner of']],
items:[
['B1',"The department store is on Main Street. It’s _____ Green Avenue and Park Avenue."],
['B2','The department store is _____ the bank.'],
['B3','The restaurant is _____ the department store.'],
['B4','The restaurant is _____ Main Street and Green Avenue.']
]},
{id:'C',title:'Directions to the bank',points:3,type:'radio',help:'Imaginá que estás en la drugstore del plano. Elegí las palabras correctas.',items:[
['C1','Just walk down Park Avenue _____ Main Street.',['to','on']],
['C2','Then turn _____.',['left','right']],
['C3','The bank is on the _____.',['left','right']]
]},
{id:'D',title:'Past tense · Match',points:5,type:'select',help:'Relacioná los verbos con las expresiones.',
matchOptions:[['a','a trip'],['b','fun'],['c','tennis'],['d','new people'],['e','swimming']],
items:[
['D1','had _____'],['D2','played _____'],['D3','took _____'],['D4','went _____'],['D5','met _____']
]},
{id:'E',title:'Simple past · Conversations',points:6,type:'text',help:'Completá con la forma apropiada en pasado simple.',items:[
['E1a','A: _____ (have) a good weekend? · Escribí la pregunta completa.'],
['E1b',"B: Not really. I _____ (study) all weekend."],
['E2a','A: _____ (do) anything last weekend? · Escribí la pregunta completa.'],
['E2b','B: Yes, they _____ (go) hiking in the woods.'],
['E3a','A: _____ (get) anything at the mall? · Escribí la pregunta completa.'],
['E3b',"B: No. She went shopping, but she _____ (not buy) anything."]
]},
{id:'F',title:'Reading · Home Alone',points:3,type:'text',help:'Leé el artículo y completá las oraciones.',
reading:"HOME ALONE\nZachary Carson, 17, had a terrible weekend. His parents went to visit his grandparents, but he stayed home. He got up early on Saturday and went to the laundry room to do laundry. He put his clothes in the washing machine. Then he tried to leave the room, but the door was locked! He pushed on the door, but it didn’t open. There wasn’t a window in the room.\nLuckily, Zachary had food to eat. There was a closet in the laundry room with some groceries in it. He also had a place to sleep. He put some clothes from the laundry on the floor and slept on them.\nHis parents came home Sunday morning and found Zachary in the laundry room. 'We called Zach late Saturday night, but he didn’t answer the phone,' said his father, 'so we came home early. We’re just happy he’s all right.'",
items:[
['F1','Zachary got up early on Saturday and _____.'],
['F2','Zachary slept on _____.'],
['F3','Zachary’s parents came home because Zachary _____.']
]}
]},
30:{number:8,units:'15–16',sections:[
{id:'A',title:'Listening · Phone conversations',points:4,type:'radio',help:'Escuchá cuatro conversaciones telefónicas y elegí la palabra correcta.',items:[
['A1','Linda is _____ now.',['in class','at home','on her break']],
['A2','David is going to _____ tomorrow.',['do laundry','study for a test','help his parents']],
['A3','Jasmine is going to _____ tomorrow.',['go on vacation','go to a concert','stay home']],
['A4','Ben is going to _____ tonight.',['go to work','go to bed early','see a movie']]
]},
{id:'B',title:'Simple past · Be',points:4,type:'text',help:'Completá con la forma pasada del verbo be.',items:[
['B1','Tonya _____ at home last night. She went to a party.'],
['B2',"Dan’s parents _____ teachers. They worked at a high school."],
['B3','_____ Jacob in class yesterday?'],
['B4','Marcos and Paula _____ born in the United States, not in Costa Rica.']
]},
{id:'C',title:'Questions in the past',points:4,type:'text',help:'Completá cada pregunta.',items:[
['C1','A: _____ in the U.S.? · B: No, they weren’t. My parents were born in Japan.'],
['C2','A: _____ grow up? · B: I grew up in Tokyo.'],
['C3','A: _____ your first English teacher? · B: My first English teacher was Mr. Sato.'],
['C4','A: _____ come to New York? · B: I came to New York in 1998.']
]},
{id:'D',title:'Telephone conversations',points:5,type:'text',help:'Completá las conversaciones con pronombres y preposiciones correctas.',items:[
['D1',"A: Can I speak to Carl, please? B: I’m sorry. He’s _____ his break."],
['D2a',"A: Hi. Is Tom there? B: Yes, but _____ can’t come to the phone."],
['D2b',"B: He’s _____ the shower."],
['D3a',"A: Hi. Is Beth in, please? B: No, she’s _____ the mall."],
['D3b',"B: Do you want to leave _____ a message?"]
]},
{id:'E',title:'Have to / Need to / Would like to',points:5,type:'radio',help:'Seleccioná la expresión correcta en cada contexto.',items:[
['E1',"A: Do you want to go shopping on Saturday? B: I’m sorry, I can’t. I _____ work on Saturday.",['’d like to','have to','want to']],
['E2','A: What are you going to do tonight? B: I have an important test tomorrow, so I _____ study.',['don’t want to','’d love to','need to']],
['E3',"A: Let’s see a movie. B: I _____, but I can’t.",['’d like to','have to','need to']],
['E4a','A: Do you _____ come to a party at my house?',['have to','need to','want to']],
['E4b',"B: Thanks. I _____!",['’d love to','have to','need to']]
]},
{id:'F',title:'Reading · Sally Ride',points:3,type:'text',help:'Leé la biografía y escribí preguntas apropiadas para las respuestas.',
reading:"THE FIRST AMERICAN WOMAN IN SPACE\nSally Ride was born on May 26, 1951, in Los Angeles, California. As a young girl, she wanted to be a tennis player, and she played tennis professionally as a teenager. She was a student at Standford University and studied English and physics. She finished her third degree at Standford in 1978 and decided she wanted to be an astronaut. That year, over 8,000 people wanted to enter the U.S. space program (NASA). Only 35 people got in. Six were women, and one was Sally Ride.\nAt NASA, Sally got a lot of training. In 1983, she took her first space flight and became the first American woman in space. Sally Ride left NASA in 1987. Today, she encourages other young women to study science and math.",
items:[
['F1','Answer: In Los Angeles, California. · Write the question.'],
['F2','Answer: English and physics. · Write the question.'],
['F3','Answer: In 1987. · Write the question.']
]}
]}
};
window.F111_B1_PC_QUESTION_BANKS=Object.freeze(banks);
})();