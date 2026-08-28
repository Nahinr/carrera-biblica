"use strict";
import './style.css';
import { supabase } from './supabaseClient.js';

const FICHAS=[
 {id:'arca',e:'🚢',n:'Arca'},{id:'corona',e:'👑',n:'Corona'},{id:'vasija',e:'🏺',n:'Vasija'},
 {id:'lampara',e:'🪔',n:'Lámpara'},{id:'rollo',e:'📜',n:'Rollo'},{id:'oveja',e:'🐑',n:'Oveja'},
 {id:'paloma',e:'🕊️',n:'Paloma'},{id:'pez',e:'🐟',n:'Pez'},{id:'llave',e:'🗝️',n:'Llave'},
 {id:'fuego',e:'🔥',n:'Fuego'},{id:'trompeta',e:'🎺',n:'Trompeta'},{id:'espiga',e:'🌾',n:'Espiga'},
 {id:'olivo',e:'🫒',n:'Olivo'},{id:'estrella',e:'⭐',n:'Estrella'},{id:'ancla',e:'⚓',n:'Ancla'}
];
const PALETA=['#6C3BF4','#1BA8F0','#12BF88','#FFB020','#FF5C7A','#A855F7','#00C2CB','#F4711F'];
const PISTAS_REQ=5;
const ESCALA_PISTAS=[1,.7,.4,.2,.1];
const escalaPista=i=>ESCALA_PISTAS[i]!==undefined?ESCALA_PISTAS[i]:ESCALA_PISTAS[ESCALA_PISTAS.length-1];
const TIPOS={
  qa:{n:'Pregunta y respuesta',ds:'Escribes la pregunta, la respuesta y la referencia.'},
  cita:{n:'Carrera de citas',ds:'Solo la referencia; los equipos la buscan y la leen.'},
  coro:{n:'Coros con la palabra',ds:'Solo una palabra; el equipo canta un coro que la contenga.'},
  pistas:{n:'Descubre el personaje',ds:'Un nombre y sus pistas, que se revelan una por una.'},
  testamento:{n:'¿Antiguo o Nuevo?',ds:'Se muestra el nombre de un libro y hay que decir a qué Testamento pertenece.'},
  moderador:{n:'Libre del moderador',ds:'Sin banco: abres la tarjeta y tú diriges.'}
};
/* oscurece un hex para la sombra 3D */
function osc(hex,f){
  f=f===undefined?.68:f;
  const n=parseInt(hex.slice(1),16);
  const r=Math.round(((n>>16)&255)*f),g=Math.round(((n>>8)&255)*f),b=Math.round((n&255)*f);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

const CATS_DEF=[
 {k:'hombres',n:'Hombres de la Biblia',ic:'🧔',modo:'turno',tipo:'qa',color:'#1BA8F0',orden:'azar',activa:true},
 {k:'mujeres',n:'Mujeres de la Biblia',ic:'👩',modo:'turno',tipo:'qa',color:'#A855F7',orden:'azar',activa:true},
 {k:'animales',n:'Animales de la Biblia',ic:'🦁',modo:'turno',tipo:'qa',color:'#F4711F',orden:'azar',activa:true},
 {k:'lugares',n:'Lugares de la Biblia',ic:'🗺️',modo:'turno',tipo:'qa',color:'#00C2CB',orden:'azar',activa:true},
 {k:'citas',n:'Carrera de Citas',ic:'⚡',modo:'abierto',tipo:'cita',color:'#FF5C7A',orden:'azar',activa:true}
];
const BANCO_DEF={
hombres:[
 {q:'¿Quién fue el primer hombre creado por Dios?',a:'Adán',r:'Génesis 2:7'},
 {q:'¿Quién mató a su hermano Abel?',a:'Caín',r:'Génesis 4:8'},
 {q:'¿Quién construyó el arca por mandato de Dios?',a:'Noé',r:'Génesis 6:14'},
 {q:'¿Quién fue llamado el amigo de Dios?',a:'Abraham',r:'Santiago 2:23'},
 {q:'¿Quién vendió su primogenitura por un guisado?',a:'Esaú',r:'Génesis 25:33-34'},
 {q:'¿Quién luchó con el ángel toda la noche?',a:'Jacob',r:'Génesis 32:24'},
 {q:'¿Quién interpretó los sueños del faraón?',a:'José',r:'Génesis 41:15-16'},
 {q:'¿Quién sacó al pueblo de Israel de Egipto?',a:'Moisés',r:'Éxodo 12:51'},
 {q:'¿Quién fue el hermano de Moisés y primer sumo sacerdote?',a:'Aarón',r:'Éxodo 28:1'},
 {q:'¿Quién hizo caer los muros de Jericó?',a:'Josué',r:'Josué 6:20'},
 {q:'¿Quién venció a los madianitas con trescientos hombres?',a:'Gedeón',r:'Jueces 7:7'},
 {q:'¿Quién perdió su fuerza cuando le cortaron el cabello?',a:'Sansón',r:'Jueces 16:19'},
 {q:'¿Quién fue el niño que servía en el templo junto a Elí?',a:'Samuel',r:'1 Samuel 3:1'},
 {q:'¿Quién fue el primer rey de Israel?',a:'Saúl',r:'1 Samuel 10:1'},
 {q:'¿Quién derribó al gigante Goliat?',a:'David',r:'1 Samuel 17:50'},
 {q:'¿Quién pidió sabiduría en lugar de riquezas?',a:'Salomón',r:'1 Reyes 3:9'},
 {q:'¿Quién subió al cielo en un carro de fuego?',a:'Elías',r:'2 Reyes 2:11'},
 {q:'¿Quién pidió una doble porción del espíritu de Elías?',a:'Eliseo',r:'2 Reyes 2:9'},
 {q:'¿Quién reconstruyó los muros de Jerusalén?',a:'Nehemías',r:'Nehemías 6:15'},
 {q:'¿Quién lo perdió todo y siguió confiando en Dios?',a:'Job',r:'Job 1:21'},
 {q:'¿Quién pasó una noche en el foso de los leones?',a:'Daniel',r:'Daniel 6:16'},
 {q:'¿Quién huyó de Dios en un barco rumbo a Tarsis?',a:'Jonás',r:'Jonás 1:3'},
 {q:'¿Quién bautizó a Jesús en el Jordán?',a:'Juan el Bautista',r:'Mateo 3:13-16'},
 {q:'¿Quién negó al Señor tres veces?',a:'Pedro',r:'Lucas 22:61'},
 {q:'¿Quién dudó hasta ver las marcas de los clavos?',a:'Tomás',r:'Juan 20:25'},
 {q:'¿Quién traicionó a Jesús por treinta piezas de plata?',a:'Judas Iscariote',r:'Mateo 26:15'},
 {q:'¿Quién era pequeño de estatura y subió a un árbol?',a:'Zaqueo',r:'Lucas 19:3-4'},
 {q:'¿Quién fue el primer mártir de la iglesia?',a:'Esteban',r:'Hechos 7:59'},
 {q:'¿Quién quedó ciego camino a Damasco?',a:'Saulo, que después fue Pablo',r:'Hechos 9:8'},
 {q:'¿Quién acompañó a Pablo y era hijo de madre judía y padre griego?',a:'Timoteo',r:'Hechos 16:1'},
 {q:'¿Quién se cayó de una ventana mientras Pablo predicaba?',a:'Eutico',r:'Hechos 20:9'},
 {q:'¿Quién caminó con Dios y no murió, porque Dios lo llevó?',a:'Enoc',r:'Génesis 5:24'}
],
mujeres:[
 {q:'¿Quién fue la primera mujer creada por Dios?',a:'Eva',r:'Génesis 2:22'},
 {q:'¿Quién se convirtió en estatua de sal?',a:'La esposa de Lot',r:'Génesis 19:26'},
 {q:'¿Quién se rió cuando oyó que tendría un hijo en su vejez?',a:'Sara',r:'Génesis 18:12'},
 {q:'¿Quién dio de beber a los camellos del siervo de Abraham?',a:'Rebeca',r:'Génesis 24:19'},
 {q:'¿Por quién trabajó Jacob catorce años?',a:'Por Raquel',r:'Génesis 29:20-28'},
 {q:'¿Quién fue la hermana de Moisés que cuidó la arquilla?',a:'María',r:'Éxodo 2:4'},
 {q:'¿Quién escondió a los espías en Jericó?',a:'Rahab',r:'Josué 2:4'},
 {q:'¿Quién fue jueza y profetisa en Israel?',a:'Débora',r:'Jueces 4:4'},
 {q:'¿Quién dijo: "Tu pueblo será mi pueblo"?',a:'Rut',r:'Rut 1:16'},
 {q:'¿Quién fue la suegra de Rut?',a:'Noemí',r:'Rut 1:14'},
 {q:'¿Quién oró en el templo pidiendo un hijo y Elí creyó que estaba ebria?',a:'Ana',r:'1 Samuel 1:13'},
 {q:'¿Quién arriesgó su vida ante el rey para salvar a su pueblo?',a:'Ester',r:'Ester 4:16'},
 {q:'¿Quién fue la reina que puso a prueba a Salomón con preguntas difíciles?',a:'La reina de Sabá',r:'1 Reyes 10:1'},
 {q:'¿Quién dio de comer a Elías con su poca harina y aceite?',a:'La viuda de Sarepta',r:'1 Reyes 17:12-16'},
 {q:'¿Qué mujer malvada fue esposa del rey Acab?',a:'Jezabel',r:'1 Reyes 21:25'},
 {q:'¿Quién fue la madre de Jesús?',a:'María',r:'Lucas 1:31'},
 {q:'¿Quién fue la madre de Juan el Bautista?',a:'Elisabet',r:'Lucas 1:13'},
 {q:'¿Quién estaba afanada sirviendo mientras su hermana escuchaba a Jesús?',a:'Marta',r:'Lucas 10:40'},
 {q:'¿Quién se sentó a los pies de Jesús a oír su palabra?',a:'María, hermana de Marta',r:'Lucas 10:39'},
 {q:'¿Quién echó en el arca de la ofrenda dos blancas, todo lo que tenía?',a:'La viuda pobre',r:'Lucas 21:2-4'},
 {q:'¿Con qué mujer conversó Jesús junto al pozo de Jacob?',a:'La mujer samaritana',r:'Juan 4:7'},
 {q:'¿Quién fue la primera en ver a Jesús resucitado?',a:'María Magdalena',r:'Juan 20:14-16'},
 {q:'¿Qué mujer vendía púrpura y creyó en Filipos?',a:'Lidia',r:'Hechos 16:14'},
 {q:'¿Quién fue la mujer llena de buenas obras que resucitó Pedro?',a:'Dorcas, también llamada Tabita',r:'Hechos 9:36-40'},
 {q:'¿Quién mintió con su esposo sobre el precio de una heredad?',a:'Safira',r:'Hechos 5:1-2'},
 {q:'¿Quién enseñó el camino de Dios a Apolos junto con su esposo Aquila?',a:'Priscila',r:'Hechos 18:26'},
 {q:'¿Quiénes fueron la abuela y la madre de Timoteo?',a:'Loida y Eunice',r:'2 Timoteo 1:5'},
 {q:'¿Quién pidió la cabeza de Juan el Bautista?',a:'La hija de Herodías, aconsejada por su madre',r:'Mateo 14:8'},
 {q:'¿Quién ungió los pies de Jesús con perfume de nardo?',a:'María, la hermana de Lázaro',r:'Juan 12:3'},
 {q:'¿Quién fue la mujer que tocó el borde del manto de Jesús para ser sanada?',a:'La mujer con flujo de sangre',r:'Marcos 5:27-29'},
 {q:'¿Quién fue la madre de Ismael?',a:'Agar',r:'Génesis 16:15'},
 {q:'¿Quién fue la esposa de Booz y bisabuela de David?',a:'Rut',r:'Rut 4:13,17'}
],
animales:[
 {q:'¿Qué animal habló para reprender a un profeta?',a:'El asna de Balaam',r:'Números 22:28'},
 {q:'¿Qué ave envió Noé primero desde el arca?',a:'Un cuervo',r:'Génesis 8:7'},
 {q:'¿Qué ave volvió al arca con una hoja de olivo?',a:'La paloma',r:'Génesis 8:11'},
 {q:'¿En la fosa de qué animales fue echado Daniel?',a:'De los leones',r:'Daniel 6:16'},
 {q:'¿Qué animal cantó cuando Pedro negó al Señor?',a:'El gallo',r:'Mateo 26:74'},
 {q:'¿Qué animales se lanzaron al mar en la región de los gadarenos?',a:'Los cerdos',r:'Marcos 5:13'},
 {q:'¿Sobre qué animal entró Jesús a Jerusalén?',a:'Sobre un pollino de asna',r:'Mateo 21:7'},
 {q:'¿Qué aves llevaron pan y carne a Elías?',a:'Los cuervos',r:'1 Reyes 17:6'},
 {q:'¿Qué animales usó Sansón para incendiar los sembrados filisteos?',a:'Trescientas zorras',r:'Jueces 15:4-5'},
 {q:'¿Con la quijada de qué animal mató Sansón a mil hombres?',a:'De un asno',r:'Jueces 15:15'},
 {q:'¿Qué animal proveyó Dios en lugar de Isaac?',a:'Un carnero trabado por los cuernos',r:'Génesis 22:13'},
 {q:'¿Qué animal de bronce levantó Moisés en el desierto?',a:'Una serpiente',r:'Números 21:9'},
 {q:'¿A qué animal se compara al diablo, que anda buscando a quién devorar?',a:'A un león rugiente',r:'1 Pedro 5:8'},
 {q:'¿Qué animal se tragó a Jonás?',a:'Un gran pez preparado por Jehová',r:'Jonás 1:17'},
 {q:'¿Qué animales invadieron Egipto en la segunda plaga?',a:'Las ranas',r:'Éxodo 8:6'},
 {q:'¿Qué comía Juan el Bautista en el desierto?',a:'Langostas y miel silvestre',r:'Mateo 3:4'},
 {q:'"Sed prudentes como serpientes y sencillos como…" ¿qué animal?',a:'Palomas',r:'Mateo 10:16'},
 {q:'¿Qué animales cuidaba David cuando Samuel lo mandó llamar?',a:'Las ovejas',r:'1 Samuel 16:11'},
 {q:'¿Qué animales tiraban del carro que devolvió el arca a Israel?',a:'Dos vacas',r:'1 Samuel 6:7'},
 {q:'¿Cómo llamó Juan el Bautista a Jesús al verlo venir?',a:'El Cordero de Dios',r:'Juan 1:29'},
 {q:'¿Qué animales devoraron a los que se burlaron de Eliseo?',a:'Dos osas',r:'2 Reyes 2:24'},
 {q:'¿Qué animal encontró Pedro con una moneda en la boca?',a:'Un pez',r:'Mateo 17:27'},
 {q:'¿Qué animales soñó el faraón que salían del río?',a:'Siete vacas gordas y siete flacas',r:'Génesis 41:2-3'},
 {q:'¿Qué insectos formaron la octava plaga de Egipto?',a:'Las langostas',r:'Éxodo 10:13-14'},
 {q:'¿Qué animal montaba el profeta Balaam?',a:'Un asna',r:'Números 22:21'},
 {q:'¿En qué animal halló Sansón un panal de miel?',a:'En el cuerpo del león que mató',r:'Jueces 14:8'},
 {q:'¿A qué se compara la fuerza del creyente que espera en Jehová, hablando de un ave?',a:'A las alas de las águilas',r:'Isaías 40:31'},
 {q:'¿Qué animal impuro vio Pedro en su visión del lienzo?',a:'Toda clase de cuadrúpedos, reptiles y aves',r:'Hechos 10:12'},
 {q:'¿Qué animal mordió a Pablo en la isla de Malta?',a:'Una víbora',r:'Hechos 28:3'},
 {q:'¿Cuántos animales de cada especie limpia entraron al arca?',a:'Siete pares',r:'Génesis 7:2'}
],
lugares:[
 {q:'¿En qué huerto puso Dios a Adán y Eva?',a:'En el huerto del Edén',r:'Génesis 2:8'},
 {q:'¿Sobre qué montes reposó el arca de Noé?',a:'Los montes de Ararat',r:'Génesis 8:4'},
 {q:'¿En qué llanura quisieron construir una torre hasta el cielo?',a:'En Sinar; la ciudad fue llamada Babel',r:'Génesis 11:2,9'},
 {q:'¿De qué ciudad salió Abraham por mandato de Dios?',a:'De Ur de los caldeos',r:'Génesis 11:31'},
 {q:'¿Qué dos ciudades destruyó Dios con fuego y azufre?',a:'Sodoma y Gomorra',r:'Génesis 19:24'},
 {q:'¿En qué monte recibió Moisés la ley?',a:'En el monte Sinaí',r:'Éxodo 19:20'},
 {q:'¿Qué mar dividió Dios para que pasara Israel?',a:'El Mar Rojo',r:'Éxodo 14:21'},
 {q:'¿Qué río cruzó Israel para entrar a Canaán?',a:'El Jordán',r:'Josué 3:17'},
 {q:'¿De qué ciudad cayeron los muros al séptimo día?',a:'Jericó',r:'Josué 6:20'},
 {q:'¿En qué monte desafió Elías a los profetas de Baal?',a:'En el monte Carmelo',r:'1 Reyes 18:19'},
 {q:'¿A qué ciudad fue enviado Jonás a predicar?',a:'A Nínive',r:'Jonás 1:2'},
 {q:'¿En qué ciudad edificó Salomón el templo?',a:'En Jerusalén',r:'1 Reyes 6:1'},
 {q:'¿En qué ciudad nació Jesús?',a:'En Belén de Judea',r:'Mateo 2:1'},
 {q:'¿En qué ciudad se crió Jesús?',a:'En Nazaret',r:'Mateo 2:23'},
 {q:'¿A qué país huyó José con el niño y su madre?',a:'A Egipto',r:'Mateo 2:14'},
 {q:'¿En qué pueblo hizo Jesús su primer milagro?',a:'En Caná de Galilea',r:'Juan 2:11'},
 {q:'¿Junto a qué pozo habló Jesús con la mujer samaritana?',a:'El pozo de Jacob, en Sicar',r:'Juan 4:5-6'},
 {q:'¿Cómo se llamaba el estanque de Jerusalén donde sanó al paralítico?',a:'Betesda',r:'Juan 5:2'},
 {q:'¿En qué huerto oró Jesús antes de ser entregado?',a:'En Getsemaní',r:'Mateo 26:36'},
 {q:'¿Dónde fue crucificado Jesús?',a:'En el Gólgota, "Lugar de la Calavera"',r:'Juan 19:17'},
 {q:'¿En qué camino iban los dos discípulos que se encontraron con Jesús resucitado?',a:'Camino a Emaús',r:'Lucas 24:13'},
 {q:'¿En qué monte ascendió Jesús al cielo?',a:'En el monte de los Olivos',r:'Hechos 1:12'},
 {q:'¿En qué camino fue Saulo alcanzado por la luz del cielo?',a:'Camino a Damasco',r:'Hechos 9:3'},
 {q:'¿En qué ciudad fueron llamados cristianos por primera vez los discípulos?',a:'En Antioquía',r:'Hechos 11:26'},
 {q:'¿En qué ciudad predicó Pablo en el Areópago?',a:'En Atenas',r:'Hechos 17:22'},
 {q:'¿En qué ciudad fueron encarcelados Pablo y Silas y hubo un terremoto?',a:'En Filipos',r:'Hechos 16:23-26'},
 {q:'¿En qué isla naufragó Pablo camino a Roma?',a:'En Malta',r:'Hechos 28:1'},
 {q:'¿En qué isla estaba Juan cuando recibió el Apocalipsis?',a:'En Patmos',r:'Apocalipsis 1:9'},
 {q:'¿Cómo se llama la ciudad que desciende del cielo en Apocalipsis?',a:'La nueva Jerusalén',r:'Apocalipsis 21:2'},
 {q:'¿En qué desierto anduvo Israel cuarenta años?',a:'En el desierto de Sinaí, camino a Canaán',r:'Números 14:33'},
 {q:'¿En qué valle se enfrentaron David y Goliat?',a:'En el valle de Ela',r:'1 Samuel 17:2'},
 {q:'¿En qué monte fue transfigurado Jesús?',a:'En un monte alto, aparte, con Pedro, Jacobo y Juan',r:'Mateo 17:1-2'}
],
citas:[
 {c:'Génesis 36:12',d:'Muy adentro del primer libro; una genealogía'},
 {c:'Éxodo 28:30',d:'Habla del Urim y el Tumim'},
 {c:'Levítico 13:47',d:'El tercer libro; trata de la lepra en los vestidos'},
 {c:'Números 33:14',d:'Una lista de campamentos en el desierto'},
 {c:'Deuteronomio 25:4',d:'No pondrás bozal al buey que trilla'},
 {c:'Josué 15:63',d:'Al final de un capítulo largo de territorios'},
 {c:'Jueces 3:31',d:'Un juez que mató filisteos con una aguijada de bueyes'},
 {c:'Rut 4:7',d:'Habla de una costumbre antigua con el calzado'},
 {c:'1 Samuel 14:27',d:'Jonatán prueba la miel'},
 {c:'2 Samuel 23:20',d:'Uno de los valientes de David'},
 {c:'1 Reyes 7:23',d:'Las medidas del mar de bronce'},
 {c:'2 Reyes 6:5',d:'A un profeta se le cae algo al agua'},
 {c:'1 Crónicas 4:10',d:'La oración de Jabes'},
 {c:'2 Crónicas 20:12',d:'Josafat dice que no sabe qué hacer'},
 {c:'Esdras 8:21',d:'Se proclama un ayuno junto a un río'},
 {c:'Nehemías 3:1',d:'Empieza la lista de los que reedificaron'},
 {c:'Ester 9:16',d:'Cerca del final del libro'},
 {c:'Job 39:19',d:'Dios habla del caballo'},
 {c:'Salmo 88:18',d:'El último versículo de un salmo muy triste'},
 {c:'Proverbios 30:28',d:'Habla de la araña en el palacio del rey'},
 {c:'Eclesiastés 10:1',d:'Las moscas muertas y el perfume'},
 {c:'Cantares 4:4',d:'Compara el cuello con una torre'},
 {c:'Isaías 38:8',d:'La sombra del reloj retrocede diez grados'},
 {c:'Jeremías 38:6',d:'Echan al profeta en una cisterna con lodo'},
 {c:'Lamentaciones 4:3',d:'Menciona a los chacales'},
 {c:'Ezequiel 4:9',d:'La receta de un pan con varios granos'},
 {c:'Daniel 8:16',d:'Aparece el nombre de un ángel'},
 {c:'Oseas 10:12',d:'Sembrad para vosotros en justicia'},
 {c:'Joel 1:4',d:'Cuatro clases de langosta'},
 {c:'Amós 7:14',d:'El profeta dice cuál era su oficio'},
 {c:'Abdías 1:4',d:'El libro de un solo capítulo'},
 {c:'Miqueas 4:4',d:'Cada uno bajo su vid y su higuera'},
 {c:'Nahúm 3:8',d:'Menciona una ciudad junto a los ríos'},
 {c:'Habacuc 3:17',d:'Aunque la higuera no florezca'},
 {c:'Sofonías 1:12',d:'Escudriñar Jerusalén con linternas'},
 {c:'Hageo 1:6',d:'El saco roto donde se echa el jornal'},
 {c:'Zacarías 11:12',d:'Treinta piezas de plata, siglos antes'},
 {c:'Malaquías 2:14',d:'El último libro del Antiguo Testamento'},
 {c:'Marcos 14:51',d:'Un joven huye dejando la sábana'},
 {c:'Lucas 13:11',d:'Una mujer encorvada por dieciocho años'},
 {c:'Juan 21:11',d:'El número exacto de peces'},
 {c:'Hechos 20:9',d:'Alguien se duerme en una ventana'},
 {c:'Romanos 16:1',d:'Pablo recomienda a una hermana'},
 {c:'1 Corintios 16:19',d:'Saludos casi al final de la carta'},
 {c:'2 Corintios 11:25',d:'Pablo cuenta sus azotes y naufragios'},
 {c:'Gálatas 4:15',d:'Habla de arrancarse los ojos'},
 {c:'Efesios 4:28',d:'El que hurtaba, no hurte más'},
 {c:'Filipenses 4:3',d:'Menciona el libro de la vida y a unas colaboradoras'},
 {c:'Colosenses 4:14',d:'Menciona a Lucas, el médico amado'},
 {c:'1 Tesalonicenses 5:27',d:'El penúltimo versículo de la carta'},
 {c:'2 Tesalonicenses 3:10',d:'Si alguno no quiere trabajar, tampoco coma'},
 {c:'1 Timoteo 5:23',d:'Un consejo sobre el estómago'},
 {c:'2 Timoteo 4:13',d:'Pablo pide su capote y los libros'},
 {c:'Tito 3:13',d:'Casi el final de una carta corta'},
 {c:'Filemón 1:11',d:'El libro de un solo capítulo, antes de Hebreos'},
 {c:'Hebreos 7:3',d:'Habla de Melquisedec'},
 {c:'Santiago 5:17',d:'Elías oró y no llovió tres años y medio'},
 {c:'2 Pedro 2:16',d:'Vuelve a mencionar al asna que habló'},
 {c:'2 Juan 1:12',d:'Habla de papel y tinta'},
 {c:'3 Juan 1:9',d:'Menciona a Diótrefes'},
 {c:'Judas 1:9',d:'Miguel disputa por el cuerpo de Moisés'},
 {c:'Apocalipsis 9:11',d:'Da dos nombres del ángel del abismo'},
 {c:'Apocalipsis 16:16',d:'Nombra un lugar de batalla'}
]
};
const CAT_PODERES=[
 {id:'av1',t:'avanzar',n:1,ic:'👣',tt:'¡Avanza 1 espacio!',ds:'Un paso más cerca de la meta.',cl:'bien',def:9},
 {id:'av2',t:'avanzar',n:2,ic:'🚀',tt:'¡Avanza 2 espacios!',ds:'Buen impulso en la pista.',cl:'bien',def:4},
 {id:'av3',t:'avanzar',n:3,ic:'💫',tt:'¡Avanza 3 espacios!',ds:'La casilla más generosa del mazo.',cl:'bien',def:1},
 {id:'nada',t:'nada',ic:'🛑',tt:'No avanzas',ds:'Te quedas donde estás, pero conservas tus puntos.',cl:'neutro',def:3},
 {id:'ret1',t:'retroceder',n:1,ic:'↩️',tt:'Retrocede 1',ds:'Un paso atrás.',cl:'mal',def:2},
 {id:'ret2',t:'retroceder',n:2,ic:'⏪',tt:'Retrocede 2',ds:'Dos pasos atrás. Todavía hay tiempo.',cl:'mal',def:1},
 {id:'bloqueo',t:'bloqueo',ic:'🚧',tt:'¡Bloqueo!',ds:'Pierdes tu próximo turno. El escudo lo anula.',cl:'mal',def:2},
 {id:'escudo',t:'escudo',ic:'🛡️',tt:'¡Escudo!',ds:'Avanzas 1 y quedas protegido del próximo bloqueo.',cl:'bien',def:2},
 {id:'doble',t:'doble',ic:'✖️',tt:'¡Doble impulso!',ds:'Tu próximo acierto vale el doble en avance y en puntos.',cl:'bien',def:2},
 {id:'robar',t:'robar',ic:'🎯',tt:'¡Frena a un rival!',ds:'Avanzas 1 y eliges un equipo que retrocede 1.',cl:'bien',def:2},
 {id:'lider',t:'lider',ic:'⚔️',tt:'¡Alcanza al líder!',ds:'Avanzas 1 y el que va adelante retrocede 1.',cl:'bien',def:2},
 {id:'empate',t:'empate',ic:'🪜',tt:'¡Salto de alcance!',ds:'Te colocas junto al equipo que va justo delante de ti.',cl:'bien',def:1},
 {id:'ptsmas',t:'ptsmas',ic:'💎',tt:'¡Puntos extra!',ds:'Avanzas 1 y ganas puntos de regalo.',cl:'bien',def:1},
 {id:'ptsmenos',t:'ptsmenos',ic:'💸',tt:'Pagas con puntos',ds:'Avanzas 1 pero pierdes puntos.',cl:'mal',def:0}
];
const poderDe=id=>CAT_PODERES.find(x=>x.id===id)||CAT_PODERES[0];
let CONF_PODERES={};
function totalMazo(){return CAT_PODERES.reduce((s,p)=>s+cantPoder(p),0);}
function cantPoder(p){const c=CONF_PODERES[p.id];return c===undefined?p.def:Math.max(0,c|0);}
function armarMazo(){
  let m=[];
  CAT_PODERES.forEach(p=>{for(let i=0;i<cantPoder(p);i++)m.push(p.id);});
  if(m.length<8){m=[];CAT_PODERES.forEach(p=>{for(let i=0;i<p.def;i++)m.push(p.id);});}
  for(let i=m.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const x=m[i];m[i]=m[j];m[j]=x;}
  return m;
}

let CATS=JSON.parse(JSON.stringify(CATS_DEF));
let BANCO=JSON.parse(JSON.stringify(BANCO_DEF));
let S={equipos:[],rondas:8,ronda:1,turno:0,turnos:0,ptsAcierto:10,
       usarCasillas:true,sonido:true,usadas:{},casillasUsadas:[],mazo:[],fin:false};
let cfgEquipos=[{nombre:'Equipo 1',ficha:'arca'},{nombre:'Equipo 2',ficha:'corona'},{nombre:'Equipo 3',ficha:'vasija'}];

const $=s=>document.querySelector(s);
const fichaDe=id=>FICHAS.find(f=>f.id===id)||FICHAS[0];
const catDe=k=>CATS.find(c=>c.k===k);
const colorEq=i=>PALETA[i%PALETA.length];
const esc=t=>String(t==null?'':t).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const cv=c=>`--c:${c};--d:${osc(c)}`;
const ls={
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},
  get(k){try{const d=localStorage.getItem(k);return d?JSON.parse(d):null;}catch(e){return null;}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};
const guardarDatos=()=>{ls.set('cbPersDatos',{cats:CATS,banco:BANCO,poderes:CONF_PODERES});programarGuardadoNube();};
const guardar=()=>ls.set('cbPersJuego',S);

let ac=null;
function bip(f=660,d=.12,tipo='sine'){
  if(!S.sonido)return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=tipo;o.frequency.value=f;o.connect(g);g.connect(ac.destination);
    g.gain.setValueAtTime(.16,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);
    o.start();o.stop(ac.currentTime+d);
  }catch(e){}
}
function confeti(n){
  n=n||70;
  for(let i=0;i<n;i++){
    const d=document.createElement('div');d.className='conf';
    d.style.left=Math.random()*100+'vw';
    d.style.background=PALETA[Math.floor(Math.random()*PALETA.length)];
    d.style.animationDuration=(2.2+Math.random()*1.8)+'s';
    d.style.animationDelay=(Math.random()*.6)+'s';
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),5000);
  }
}

/* ============ CONFIGURACIÓN ============ */
function pintarConfig(){
  const cont=$('#listaEquipos');cont.innerHTML='';
  cfgEquipos.forEach((eq,i)=>{
    const d=document.createElement('div');d.className='eqc';d.style.cssText=cv(colorEq(i));
    d.innerHTML=`<div class="ava">${fichaDe(eq.ficha).e}</div>
      <input type="text" value="${esc(eq.nombre)}" data-i="${i}" class="nomEq" placeholder="Nombre del equipo">
      ${cfgEquipos.length>2?`<button class="quitar" data-del="${i}">×</button>`:'<span></span>'}
      <div class="fichas"></div>`;
    cont.appendChild(d);
    const sel=d.querySelector('.fichas');
    FICHAS.forEach(f=>{
      const usada=cfgEquipos.some((e2,j)=>j!==i&&e2.ficha===f.id);
      const b=document.createElement('button');
      b.textContent=f.e;b.title=f.n;b.disabled=usada;
      if(eq.ficha===f.id)b.classList.add('on');
      b.onclick=()=>{cfgEquipos[i].ficha=f.id;pintarConfig();};
      sel.appendChild(b);
    });
  });
  cont.querySelectorAll('.nomEq').forEach(inp=>{
    inp.oninput=e=>{cfgEquipos[+e.target.dataset.i].nombre=e.target.value;pintarSelInicia();};
  });
  cont.querySelectorAll('[data-del]').forEach(b=>{
    b.onclick=()=>{cfgEquipos.splice(+b.dataset.del,1);pintarConfig();};
  });
  pintarSelInicia();
}
function pintarSelInicia(){
  const s=$('#selInicia'),v=s.value;s.innerHTML='';
  cfgEquipos.forEach((eq,i)=>{
    const o=document.createElement('option');o.value=i;o.textContent=eq.nombre||('Equipo '+(i+1));s.appendChild(o);
  });
  if(v!==''&&+v<cfgEquipos.length)s.value=v;
}
function pintarChipsCats(){
  const c=$('#chipsCats');c.innerHTML='';
  CATS.forEach(v=>{
    const b=document.createElement('button');
    b.className='chip'+(v.activa?' on':'');
    if(v.activa){b.style.background=v.color;b.style.boxShadow='0 3px 0 '+osc(v.color);}
    b.textContent=v.ic+' '+v.n;
    b.onclick=()=>{v.activa=!v.activa;guardarDatos();pintarChipsCats();};
    c.appendChild(b);
  });
}
$('#btnAddEq').onclick=()=>{
  if(cfgEquipos.length>=6)return;
  const libre=FICHAS.find(f=>!cfgEquipos.some(e=>e.ficha===f.id));
  cfgEquipos.push({nombre:'Equipo '+(cfgEquipos.length+1),ficha:libre?libre.id:'rollo'});
  pintarConfig();
};
$('#chipCasillas').onclick=e=>{S.usarCasillas=!S.usarCasillas;e.target.classList.toggle('on',S.usarCasillas);
  e.target.style.background=S.usarCasillas?'var(--violeta)':'';};
$('#chipSonido').onclick=e=>{S.sonido=!S.sonido;e.target.classList.toggle('on',S.sonido);
  e.target.style.background=S.sonido?'var(--celeste)':'';bip(880,.08);};
$('#btnIniciar').onclick=()=>{
  if(!CATS.some(c=>c.activa)){alert('Prende al menos una categoría.');return;}
  S.rondas=Math.max(3,Math.min(20,+$('#inpRondas').value||8));
  S.ptsAcierto=Math.max(1,+$('#inpPts').value||10);
  S.equipos=cfgEquipos.map((e,i)=>({id:i,nombre:e.nombre||('Equipo '+(i+1)),ficha:e.ficha,color:colorEq(i),
    pos:0,posVis:0,puntos:0,aciertos:0,bloqueado:false,escudo:false,doble:false}));
  S.turno=+$('#selInicia').value||0;S.turnos=0;S.ronda=1;S.fin=false;S.usadas={};S.casillasUsadas=[];S.mazo=armarMazo();
  irA('pJuego');
  $('#rondaT').textContent=S.rondas;$('#turnoT').textContent=S.equipos.length;
  pintarEquipos();pintarCats();pintarTurno();pintarMod();guardar();
  bip(523,.1);setTimeout(()=>bip(784,.16),120);
};
function irA(id){
  ['pConfig','pJuego','pAdmin'].forEach(p=>$('#'+p).classList.toggle('oculto',p!==id));
  window.scrollTo(0,0);
}

/* ============ TABLERO ============ */
const pct=p=>((p+0.5)/(S.rondas+1)*100)+'%';
function pintarEquipos(){
  const t=$('#equipos');t.innerHTML='';
  S.equipos.forEach(eq=>{
    const f=fichaDe(eq.ficha);
    const d=document.createElement('div');
    d.className='eq'+(eq.id===S.turno?' activo':'')+(eq.bloqueado?' dormido':'');
    d.style.cssText=cv(eq.color);
    let tags='';
    if(eq.bloqueado)tags+='<span class="tag b">bloqueado</span>';
    if(eq.escudo)tags+='<span class="tag e">escudo</span>';
    if(eq.doble)tags+='<span class="tag d">×2</span>';
    d.innerHTML=`<div class="ident"><div class="ava">${f.e}</div>
        <div style="min-width:0">
          <div class="nm">${esc(eq.nombre)}${tags}</div>
          <div class="sc">${eq.puntos} <small>PTS</small></div>
        </div></div>
      <div style="display:flex;align-items:center">
        <div class="carril" style="flex:1"><div class="pasos"></div>
          <span class="ficha" id="ficha-${eq.id}"><b>${f.e}</b></span></div>
        <div class="meta-i">🏆</div>
      </div>`;
    const pasos=d.querySelector('.pasos');
    pasos.style.gridTemplateColumns='repeat('+(S.rondas+1)+',1fr)';
    for(let i=0;i<=S.rondas;i++){
      const c=document.createElement('div');
      c.className='paso'+(i===0?' salida':'')+(i>0&&i<=eq.posVis?' hecho':'');
      pasos.appendChild(c);
    }
    d.querySelector('.ficha').style.left=pct(eq.posVis);
    t.appendChild(d);
  });
}
let animando=false;
function toast(txt){
  const t=document.createElement('div');t.className='toast';t.textContent=txt;
  document.body.appendChild(t);
  setTimeout(()=>{if(t.parentElement)t.remove();},3200);
}
function animarTodos(cb){
  const pend=S.equipos.filter(e=>e.posVis!==e.pos);
  if(!pend.length){animando=false;pintarEquipos();cb&&cb();return;}
  animando=true;
  let listos=0;
  const terminado=()=>{
    if(++listos<pend.length)return;
    animando=false;
    pend.forEach(e=>{const x=document.getElementById('ficha-'+e.id);if(x)x.classList.remove('salto');});
    pintarEquipos();cb&&cb();
  };
  pend.forEach(eq=>{
    const el=document.getElementById('ficha-'+eq.id);
    const delta=eq.pos-eq.posVis;
    if(el&&el.parentElement){
      const av=document.createElement('span');
      av.className='delta';av.textContent=(delta>0?'+':'')+delta;
      el.parentElement.appendChild(av);
      setTimeout(()=>{if(av.parentElement)av.remove();},1700);
    }
    const paso=()=>{
      if(eq.posVis===eq.pos){terminado();return;}
      eq.posVis+=eq.pos>eq.posVis?1:-1;
      if(el){
        el.style.left=pct(eq.posVis);
        el.classList.remove('salto');void el.offsetWidth;el.classList.add('salto');
        const cont=el.parentElement.querySelectorAll('.paso');
        cont.forEach((p,i)=>p.classList.toggle('hecho',i>0&&i<=eq.posVis));
      }
      bip(620+eq.posVis*40,.07);
      setTimeout(paso,360);
    };
    /* dos cuadros de espera: el navegador dibuja primero la casilla de salida
       y así la transición del movimiento se ve de verdad */
    if(window.requestAnimationFrame)requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(paso,60)));
    else setTimeout(paso,80);
  });
}
function pintarTurno(){
  const eq=S.equipos[S.turno];
  $('#turnera').style.cssText=cv(eq.color);
  $('#turnoEm').textContent=fichaDe(eq.ficha).e;
  $('#turnoNom').textContent=eq.nombre;
  $('#rondaN').textContent=S.ronda;
  $('#turnoN').textContent=(S.turnos%S.equipos.length)+1;
}
function pintarCats(){
  const c=$('#cats');c.innerHTML='';
  CATS.filter(v=>v.activa).forEach(v=>{
    const inf=v.tipo==='moderador';
    const total=(BANCO[v.k]||[]).length,usadas=(S.usadas[v.k]||[]).length;
    const b=document.createElement('button');
    b.className='cat';b.disabled=!inf&&usadas>=total;b.style.cssText=cv(v.color);
    b.innerHTML=`<span class="ic">${v.ic}</span>
      <span class="nm">${esc(v.n)}</span>
      <span class="qd">${v.modo==='abierto'?'Punto abierto':'Solo el turno'} · ${inf?'sin límite':(total-usadas)}</span>`;
    b.onclick=()=>abrirPregunta(v.k);
    c.appendChild(b);
  });
}

/* ============ PREGUNTAS ============ */
function siguienteItem(k){
  const banco=BANCO[k]||[],cat=catDe(k);
  S.usadas[k]=S.usadas[k]||[];
  const libres=banco.map((_,i)=>i).filter(i=>!S.usadas[k].includes(i));
  if(!libres.length)return null;
  const idx=(cat&&cat.orden==='fijo')?libres[0]:libres[Math.floor(Math.random()*libres.length)];
  S.usadas[k].push(idx);
  return banco[idx];
}
function modal(html,ancho){
  $('#modales').innerHTML=`<div class="velo"><div class="hoja"${ancho?` style="width:min(${ancho}px,100%)"`:''}>${html}</div></div>`;
  return $('#modales .hoja');
}
function cerrarModal(){$('#modales').innerHTML='';}

function abrirPregunta(k){
  if(animando||S.fin)return;
  const cat=catDe(k);
  let cuerpo='',respuesta='',it=null;
  if(cat.tipo==='moderador'){
    cuerpo=`<div class="pregunta">${esc(cat.n)}</div>
      <p class="nota">Tú diriges esta ronda: elige la lectura o la pregunta y marca abajo quién gana el punto.</p>`;
  }else{
    it=siguienteItem(k);
    if(!it){pintarCats();return;}
    if(cat.tipo==='qa'){
      cuerpo=`<div class="pregunta">${esc(it.q)}</div>`;
      respuesta=`<div class="respuesta oculto" id="resp"><span class="lb">Respuesta</span>
        <div class="tx">${esc(it.a)}</div>${it.r?`<div class="rf">${esc(it.r)}</div>`:''}</div>`;
    }else if(cat.tipo==='cita'){
      cuerpo=`<div style="text-align:center">
        <div class="nota" style="font-weight:800">Busquen y lean en voz alta</div>
        <div class="pregunta" style="font-size:clamp(38px,6.5vw,80px);margin:10px 0;color:${cat.color}">${esc(it.c)}</div>
        ${it.d?`<div class="ayuda oculto" id="ayuda">💡 ${esc(it.d)}</div>
        <button class="mini" id="btnAyuda" style="margin-bottom:16px">Dar una pista</button>`:''}
        <div class="nota">Gana el primer equipo que la encuentre y la lea completa.</div></div>`;
    }else if(cat.tipo==='testamento'){
      cuerpo=`<div style="text-align:center">
        <div class="nota" style="font-weight:800">¿A qué Testamento pertenece este libro?</div>
        <div class="pregunta" style="font-size:clamp(40px,7vw,88px);margin:10px 0;color:${cat.color}">${esc(it.n)}</div></div>`;
      respuesta=`<div class="respuesta oculto" id="resp"><span class="lb">Respuesta</span>
        <div class="tx">${it.t==='nt'?'Nuevo Testamento':'Antiguo Testamento'}</div></div>`;
    }else if(cat.tipo==='coro'){
      cuerpo=`<div style="text-align:center">
        <div class="nota" style="font-weight:800">Un coro que contenga la palabra</div>
        <div class="pregunta" style="font-size:clamp(42px,8vw,96px);margin:10px 0;color:${cat.color}">${esc(it.p)}</div>
        <div class="nota">El equipo lo inicia y la congregación lo canta completo.</div></div>`;
    }else if(cat.tipo==='pistas'){
      cuerpo=`<div class="valor-pistas" id="valorP"></div>
        <div class="pistas" id="pistas"></div>
        <button class="b3 chico" id="btnPista" style="${cv(cat.color)};margin-bottom:20px">+ Siguiente pista</button>`;
      respuesta=`<div class="respuesta oculto" id="resp"><span class="lb">Personaje</span>
        <div class="tx">${esc(it.n)}</div></div>`;
    }
  }
  const c=modal(`
    <div class="cab" style="${cv(cat.color)}"><span class="ic">${cat.ic}</span><h2>${esc(cat.n)}</h2>
      <span class="modo">${cat.modo==='abierto'?'Punto abierto':esc(S.equipos[S.turno].nombre)}</span></div>
    <div class="cont">
    ${cuerpo}${respuesta}
    <div class="asignar"><div class="lb">¿Quién gana el punto?</div><div class="eq-btns" id="eqBtns"></div></div></div>`);

  let factor=1;
  if(cat.tipo==='pistas'){
    let i=0;
    const valor=()=>c.querySelector('#valorP').innerHTML=
      `<span class="vp" style="background:${cat.color}">Vale ${Math.max(1,Math.round(S.ptsAcierto*escalaPista(i-1)))} pts</span>`+
      `<span class="vp gris">${i} de ${it.p.length} pistas</span>`;
    const pintarPista=()=>{
      if(i>=it.p.length)return;
      const d=document.createElement('div');d.className='pista-i';
      d.innerHTML=`<span class="n" style="background:${cat.color}">${i+1}</span><span>${esc(it.p[i])}</span>`;
      c.querySelector('#pistas').appendChild(d);i++;bip(700,.07);
      factor=escalaPista(i-1);valor();
      if(i>=it.p.length)c.querySelector('#btnPista').disabled=true;
    };
    pintarPista();
    c.querySelector('#btnPista').onclick=pintarPista;
  }
  const ba=c.querySelector('#btnAyuda');
  if(ba)ba.onclick=()=>{c.querySelector('#ayuda').classList.remove('oculto');ba.remove();};
  const btns=c.querySelector('#eqBtns');
  (cat.modo==='abierto'?S.equipos:[S.equipos[S.turno]]).forEach(eq=>{
    const b=document.createElement('button');b.className='eq-btn';b.style.cssText=cv(eq.color);
    b.innerHTML=`<span class="em">${fichaDe(eq.ficha).e}</span>${esc(eq.nombre)}`;
    b.onclick=()=>{if(btns.dataset.listo)return;btns.dataset.listo='1';
      btns.querySelectorAll('button').forEach(x=>x.disabled=true);resolver(eq.id,factor);};
    btns.appendChild(b);
  });
  if(respuesta){
    const vr=document.createElement('button');vr.className='eq-btn';vr.style.cssText='--c:#7A7392;--d:#544E68';
    vr.innerHTML='<span class="em">👁️</span>Ver respuesta';
    vr.onclick=()=>{c.querySelector('#resp').classList.remove('oculto');vr.remove();};
    btns.appendChild(vr);
  }
  const nadie=document.createElement('button');nadie.className='eq-btn solo-x';nadie.style.cssText=cv('#FF5C7A');
  nadie.title='Nadie acertó';nadie.innerHTML='✖';
  nadie.onclick=()=>{if(btns.dataset.listo)return;btns.dataset.listo='1';
    bip(220,.25,'sawtooth');cerrarModal();pasarTurno();};
  btns.appendChild(nadie);
  pintarCats();guardar();
}

function resolver(idEquipo,factor){
  const eq=S.equipos[idEquipo];
  const gana=Math.max(1,Math.round(S.ptsAcierto*(factor||1)))*(eq.doble?2:1);
  eq.aciertos++;eq.puntos+=gana;eq.ultimo=gana;
  bip(660,.1);setTimeout(()=>bip(880,.16),110);
  if(S.usarCasillas)abrirCasillas(eq);
  else{aplicarAvance(eq,1);cerrarModal();pintarEquipos();animarTodos(()=>{if(!revisarFin())pasarTurno();});}
}
function abrirCasillas(eq){
  if(!S.mazo||!S.mazo.length)S.mazo=armarMazo();
  if(S.casillasUsadas.length>=S.mazo.length){S.mazo=armarMazo();S.casillasUsadas=[];toast('🔄 Se acabaron los números: se reparten de nuevo');}
  const c=modal(`<div class="cab" style="${cv(eq.color)}"><span class="ic">${fichaDe(eq.ficha).e}</span>
      <h2>${esc(eq.nombre)}, destapa un número</h2>
      <span class="modo">+${eq.ultimo} puntos · ${S.mazo.length-S.casillasUsadas.length} números sin destapar</span></div>
    <div class="cont"><div class="grid-cas" id="gridCas"></div>
      <div style="text-align:center;margin-top:18px"><button class="mini" id="verPod">¿Qué puede salir?</button></div></div>`,940);
  c.querySelector('#verPod').onclick=()=>verPoderes(()=>abrirCasillas(eq));
  const g=c.querySelector('#gridCas');
  S.mazo.forEach((_,i)=>{
    const b=document.createElement('button');b.className='cas';b.style.cssText=cv(eq.color);
    const usada=S.casillasUsadas.includes(i);
    b.disabled=usada;b.textContent=usada?'✕':(i+1);
    b.onclick=()=>{if(g.dataset.listo)return;g.dataset.listo='1';
      g.querySelectorAll('button').forEach(x=>x.disabled=true);
      S.casillasUsadas.push(i);revelarCasilla(eq,i);};
    g.appendChild(b);
  });
}
function revelarCasilla(eq,i){
  const ef=poderDe(S.mazo[i]),info=ef;
  const c=modal(`<div class="cab" style="${cv(eq.color)}"><span class="ic">${fichaDe(eq.ficha).e}</span>
      <h2>${esc(eq.nombre)} · número ${i+1}</h2></div>
    <div class="cont"><div class="revelado ${info.cl}"><span class="em">${info.ic}</span>
      <div class="tt">${info.tt}</div><div class="ds">${info.ds}</div></div>
    <div id="extra"></div>
    <div style="text-align:center"><button class="b3" id="btnOk" style="${cv(eq.color)}">Aplicar y seguir</button></div></div>`,720);
  bip(info.cl==='mal'?200:info.cl==='neutro'?400:784,.2,info.cl==='mal'?'sawtooth':'sine');
  let aplicado=false;
  const finalizar=()=>{
    if(aplicado)return;aplicado=true;
    cerrarModal();pintarEquipos();pintarMod();guardar();
    animarTodos(()=>{if(!revisarFin())pasarTurno();});
  };
  const aviso=t=>{const x=c.querySelector('#extra');
    if(x)x.innerHTML='<p class="nota" style="text-align:center;margin-bottom:16px">'+t+'</p>';};
  if(ef.t==='robar'||ef.t==='lider'){
    const rivales=S.equipos.filter(e=>e.id!==eq.id);
    if(!rivales.length)aplicarAvance(eq,1);
    else if(ef.t==='lider'){
      const max=Math.max(...rivales.map(e=>e.pos));
      const lider=rivales.find(e=>e.pos===max);
      aplicarAvance(eq,1);
      if(lider.pos>0){lider.pos--;aviso(esc(lider.nombre)+' retrocede 1 espacio.');}
      else aviso('Nadie ha salido todavía: solo avanzas tú.');
    }else{
      c.querySelector('#btnOk').classList.add('oculto');
      const cont=c.querySelector('#extra');
      cont.innerHTML='<div class="lb" style="text-align:center;font-weight:800;color:var(--tinta2);margin-bottom:12px">¿Quién retrocede?</div><div class="eq-btns" style="justify-content:center" id="rb"></div>';
      rivales.forEach(r=>{
        const b=document.createElement('button');b.className='eq-btn';b.style.cssText=cv(r.color);
        b.innerHTML=`<span class="em">${fichaDe(r.ficha).e}</span>${esc(r.nombre)}`;
        b.onclick=()=>{if(aplicado)return;aplicarAvance(eq,1);r.pos=Math.max(0,r.pos-1);finalizar();};
        cont.querySelector('#rb').appendChild(b);
      });
      return;
    }
  }
  else if(ef.t==='avanzar'){
    const antes=eq.pos,doble=eq.doble;aplicarAvance(eq,ef.n);
    if(doble)aviso('Tenías ×2 acumulado: avanzas '+(eq.pos-antes)+' en lugar de '+ef.n+'.');
    else if(eq.pos===antes)aviso('Ya estás en la meta: no puedes avanzar más.');
    else if(eq.pos-antes<ef.n)aviso('Llegaste a la meta con '+(eq.pos-antes)+'.');
  }
  else if(ef.t==='retroceder'){
    if(eq.pos===0)aviso('Estás en la salida: no puedes retroceder más, pero pierdes puntos.');
    else eq.pos=Math.max(0,eq.pos-ef.n);
    eq.puntos=Math.max(0,eq.puntos-Math.round(S.ptsAcierto/2));
  }
  else if(ef.t==='bloqueo'){
    if(eq.escudo){eq.escudo=false;aviso('🛡️ Tu escudo anuló el bloqueo y ya se gastó.');}
    else{eq.bloqueado=true;aviso('Perderás tu próxima participación de la ronda.');}
  }
  else if(ef.t==='escudo'){
    if(eq.escudo)aviso('Ya tenías escudo: sigue activo y avanzas 1.');
    eq.escudo=true;aplicarAvance(eq,1);
  }
  else if(ef.t==='doble'){
    if(eq.doble)aviso('Ya tenías ×2 guardado: sigue disponible.');
    eq.doble=true;
  }
  else if(ef.t==='empate'){
    const delante=S.equipos.filter(e=>e.id!==eq.id&&e.pos>eq.pos);
    if(delante.length){
      const destino=Math.min.apply(null,delante.map(e=>e.pos));
      const quien=delante.filter(e=>e.pos===destino).map(e=>e.nombre).join(' y ');
      eq.pos=Math.min(S.rondas,destino);
      aviso('Te pones a la par de '+esc(quien)+'.');
    }else{aplicarAvance(eq,1);aviso('Ya vas de primero: avanzas 1 espacio.');}
  }
  else if(ef.t==='ptsmas'){
    aplicarAvance(eq,1);eq.puntos+=S.ptsAcierto;
    aviso('Ganas '+S.ptsAcierto+' puntos de regalo.');
  }
  else if(ef.t==='ptsmenos'){
    aplicarAvance(eq,1);
    const q=Math.min(eq.puntos,S.ptsAcierto);eq.puntos-=q;
    aviso(q?('Pierdes '+q+' puntos.'):'No tenías puntos que perder.');
  }
  c.querySelector('#btnOk').onclick=finalizar;
}
function aplicarAvance(eq,n){
  let mov=n;
  if(eq.doble){mov=n*2;eq.doble=false;}
  eq.pos=Math.min(S.rondas,eq.pos+mov);
}
function verPoderes(volver){
  const rest={};
  (S.mazo||[]).forEach((id,i)=>{if(!S.casillasUsadas.includes(i))rest[id]=(rest[id]||0)+1;});
  let filas='';
  CAT_PODERES.forEach(p=>{
    const q=rest[p.id]||0;const total=(S.mazo||[]).filter(x=>x===p.id).length;
    if(!total)return;
    filas+=`<div class="pod-fila"><span class="pi">${p.ic}</span>
      <span class="pt"><b>${p.tt}</b><i>${p.ds}</i></span>
      <span class="pq ${q?'':'off'}">${q} de ${total}</span></div>`;
  });
  const c=modal(`<div class="cab" style="${cv('#6C3BF4')}"><span class="ic">🎲</span><h2>Poderes del mazo</h2>
      <span class="modo">${(S.mazo||[]).length-S.casillasUsadas.length} sin destapar</span></div>
    <div class="cont">${filas}
    <div style="text-align:center;margin-top:18px"><button class="b3" id="pCerrar">Volver</button></div></div>`,700);
  c.querySelector('#pCerrar').onclick=()=>{cerrarModal();if(volver)volver();};
}
function pasarTurno(){
  if(S.fin)return;
  cerrarModal();
  let intentos=0,saltados=[];
  while(intentos<S.equipos.length*2){
    S.turnos++;S.turno=(S.turno+1)%S.equipos.length;intentos++;
    const eq=S.equipos[S.turno];
    if(eq.bloqueado){eq.bloqueado=false;saltados.push(eq.nombre);continue;}
    break;
  }
  if(saltados.length)toast('🚧 '+saltados.join(' y ')+(saltados.length>1?' pierden':' pierde')+' el turno por bloqueo');
  S.ronda=Math.floor(S.turnos/S.equipos.length)+1;
  if(S.ronda>S.rondas){terminar();return;}
  pintarEquipos();pintarTurno();pintarCats();pintarMod();guardar();
}
function revisarFin(){
  const g=S.equipos.find(e=>e.pos>=S.rondas);
  if(g){terminar(g);return true;}
  return false;
}
function terminar(ganador){
  S.fin=true;
  const orden=[...S.equipos].sort((a,b)=>b.pos-a.pos||b.puntos-a.puntos);
  const g=ganador||orden[0];
  let html=`<div class="cab" style="${cv(g.color)}"><span class="ic">🏆</span><h2>¡Resultado final!</h2></div><div class="cont">
    <div style="text-align:center;margin-bottom:26px">
      <div style="font-size:76px;animation:pop .5s cubic-bezier(.2,1.6,.4,1)">${fichaDe(g.ficha).e}</div>
      <div style="font-size:clamp(28px,4.5vw,46px);font-weight:800;color:${g.color}">${esc(g.nombre)}</div>
      <div class="nota">Llegó más lejos en la carrera</div></div>`;
  orden.forEach((e,i)=>{
    html+=`<div class="pod ${i===0?'p1':''}" style="${cv(e.color)}"><span class="pos">${i+1}</span>
      <span class="ava">${fichaDe(e.ficha).e}</span><span class="nm">${esc(e.nombre)}</span>
      <span class="sc"><b>${e.puntos} pts</b>${e.aciertos} aciertos · espacio ${e.pos}</span></div>`;
  });
  html+=`<div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
    <button class="b3 pale" id="btnSeguir">Seguir jugando (+2 rondas)</button>
    <button class="b3" id="btnNuevo">Nueva partida</button></div></div>`;
  const c=modal(html,720);
  confeti(110);
  bip(523,.15);setTimeout(()=>bip(659,.15),160);setTimeout(()=>bip(784,.35),320);
  c.querySelector('#btnSeguir').onclick=()=>{
    S.fin=false;S.rondas+=2;$('#rondaT').textContent=S.rondas;
    cerrarModal();pintarEquipos();pintarCats();guardar();
  };
  c.querySelector('#btnNuevo').onclick=()=>{ls.del('cbPersJuego');location.reload();};
}

/* ============ MODERADOR ============ */
function pintarMod(){
  const c=$('#modFilas');if(!c)return;c.innerHTML='';
  S.equipos.forEach(eq=>{
    const d=document.createElement('div');d.className='modf';
    d.innerHTML=`<span class="nm">${fichaDe(eq.ficha).e} ${esc(eq.nombre)}</span>
      <button class="mini" data-a="p-">−${S.ptsAcierto} pts</button>
      <button class="mini" data-a="p+">+${S.ptsAcierto} pts</button>
      <button class="mini" data-a="-1">◀ espacio</button>
      <button class="mini" data-a="1">espacio ▶</button>
      <button class="mini" data-a="turno">Darle el turno</button>
      <button class="mini" data-a="bloq">${eq.bloqueado?'Quitar bloqueo':'Bloquear'}</button>
      <button class="mini" data-a="esc">${eq.escudo?'Quitar escudo':'Dar escudo'}</button>`;
    d.querySelectorAll('.mini').forEach(b=>{
      b.onclick=()=>{
        const a=b.dataset.a;
        if(a==='1')eq.pos=Math.min(S.rondas,eq.pos+1);
        else if(a==='-1')eq.pos=Math.max(0,eq.pos-1);
        else if(a==='p+')eq.puntos+=S.ptsAcierto;
        else if(a==='p-')eq.puntos=Math.max(0,eq.puntos-S.ptsAcierto);
        else if(a==='turno'){S.turno=eq.id;pintarTurno();}
        else if(a==='bloq')eq.bloqueado=!eq.bloqueado;
        else if(a==='esc')eq.escudo=!eq.escudo;
        pintarMod();guardar();pintarEquipos();animarTodos();
      };
    });
    c.appendChild(d);
  });
}
$('#btnPoderes').onclick=()=>verPoderes();
$('#btnPanelMod').onclick=()=>$('#panelMod').classList.toggle('oculto');
$('#btnSaltar').onclick=()=>pasarTurno();
$('#btnRondaMas').onclick=()=>{S.rondas++;$('#rondaT').textContent=S.rondas;pintarEquipos();guardar();};
$('#btnReiniciar').onclick=()=>{if(confirm('¿Reiniciar la partida desde cero?')){ls.del('cbPersJuego');location.reload();}};
$('#btnTerminar').onclick=()=>terminar();

/* ============ ADMIN ============ */
let adminK=null,editIdx=null,volverA='pConfig';
$('#btnAdmin1').onclick=()=>{volverA='pConfig';abrirAdmin();};
$('#btnAdmin2').onclick=()=>{volverA='pJuego';abrirAdmin();};
$('#btnVolver').onclick=()=>{irA(volverA);volverA==='pConfig'?pintarChipsCats():pintarCats();};
function abrirAdmin(){
  irA('pAdmin');
  if(!adminK||!catDe(adminK))adminK=CATS.length?CATS[0].k:null;
  pintarAdminCats();pintarDetalle();
}
function pintarAdminCats(){
  const c=$('#adminCats');c.innerHTML='';
  $('#subCats').textContent=CATS.length+' categorías · '+
    Object.values(BANCO).reduce((s,a)=>s+(a?a.length:0),0)+' preguntas';
  CATS.forEach(v=>{
    const total=(BANCO[v.k]||[]).length;
    const b=document.createElement('button');
    b.className='cat-i'+(v.k===adminK?' sel':'');b.style.cssText=cv(v.color);
    b.innerHTML=`<span class="ic">${v.ic}</span><span class="tx">
      <span class="nm">${esc(v.n)}</span>
      <span class="sb">${TIPOS[v.tipo].n} · ${v.tipo==='moderador'?'sin banco':total+' preg.'}</span></span>
      ${v.activa?'':'<span class="off">oculta</span>'}`;
    b.onclick=()=>{adminK=v.k;editIdx=null;pintarAdminCats();pintarDetalle();};
    c.appendChild(b);
  });
}
function pintarDetalle(){
  const d=$('#adminDetalle');
  const cat=catDe(adminK);
  if(!cat){d.innerHTML='<p class="nota">Crea una categoría para empezar.</p>';return;}
  BANCO[cat.k]=BANCO[cat.k]||[];
  const lista=BANCO[cat.k];
  d.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px">
      <h2 style="flex:1">${cat.ic} ${esc(cat.n)}</h2>
      <button class="mini" id="edCat">Editar</button>
      <button class="mini" id="delCat" style="background:#FFE3E8;color:var(--coral)">Eliminar</button>
    </div>
    <div class="sub">${TIPOS[cat.tipo].n} · ${cat.modo==='abierto'?'punto abierto':'solo el turno'}${cat.tipo==='moderador'?'':' · '+(cat.orden==='fijo'?'en orden de la lista':'al azar')}</div>
    <div class="aviso">${TIPOS[cat.tipo].ds}</div>
    ${cat.tipo==='moderador'?'<p class="nota">Esta categoría no lleva banco de preguntas.</p>':
      `<div id="formQ"></div>
       <div class="tit-sec" style="margin:24px 0 12px">En el banco · ${lista.length}</div>
       <div id="listaQ"></div>`}`;
  d.querySelector('#edCat').onclick=()=>editorCategoria(cat);
  d.querySelector('#delCat').onclick=()=>{
    if(confirm('¿Eliminar la categoría "'+cat.n+'" y todas sus preguntas?')){
      CATS=CATS.filter(x=>x.k!==cat.k);delete BANCO[cat.k];
      adminK=CATS.length?CATS[0].k:null;guardarDatos();pintarAdminCats();pintarDetalle();
    }
  };
  if(cat.tipo!=='moderador'){pintarFormQ(cat);pintarListaQ(cat);}
}
function pintarFormQ(cat){
  const f=$('#formQ');const ed=editIdx!==null?BANCO[cat.k][editIdx]:null;
  let campos='';
  if(cat.tipo==='qa'){
    campos=`<div class="campo"><label>Pregunta</label><textarea id="f1" rows="2">${esc(ed?ed.q:'')}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 220px;gap:14px">
        <div class="campo"><label>Respuesta</label><input type="text" id="f2" value="${esc(ed?ed.a:'')}"></div>
        <div class="campo"><label>Referencia</label><input type="text" id="f3" value="${esc(ed?ed.r:'')}"></div></div>`;
  }else if(cat.tipo==='cita'){
    campos=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="campo"><label>Cita bíblica</label><input type="text" id="f1" value="${esc(ed?ed.c:'')}" placeholder="Ej.: Filipenses 4:13"></div>
      <div class="campo"><label>Pista para ubicarla (opcional)</label><input type="text" id="f2" value="${esc(ed?ed.d:'')}" placeholder="Ej.: una carta de Pablo"></div></div>`;
  }else if(cat.tipo==='testamento'){
    campos=`<div style="display:grid;grid-template-columns:1fr 220px;gap:14px">
      <div class="campo"><label>Nombre del libro</label><input type="text" id="f1" value="${esc(ed?ed.n:'')}" placeholder="Ej.: Hebreos"></div>
      <div class="campo"><label>Pertenece a</label><select id="f2">
        <option value="at"${ed&&ed.t==='at'?' selected':''}>Antiguo Testamento</option>
        <option value="nt"${ed&&ed.t==='nt'?' selected':''}>Nuevo Testamento</option>
      </select></div></div>`;
  }else if(cat.tipo==='coro'){
    campos=`<div class="campo"><label>Palabra</label><input type="text" id="f1" value="${esc(ed?ed.p:'')}" placeholder="Ej.: ALELUYA"></div>`;
  }else if(cat.tipo==='pistas'){
    campos=`<div class="campo"><label>Personaje</label><input type="text" id="f1" value="${esc(ed?ed.n:'')}"></div>
      <div class="campo"><label>Pistas — exactamente 5, una por línea, de la más difícil a la más fácil</label>
        <textarea id="f2" rows="5" placeholder="Pista 1 (la más difícil)&#10;Pista 2&#10;Pista 3&#10;Pista 4&#10;Pista 5 (la más fácil)">${esc(ed?ed.p.join('\n'):'')}</textarea>
        <p class="nota" style="margin-top:6px">Adivinar con la 1.ª pista vale el 100% de los puntos; luego 70%, 40%, 20% y 10%.</p></div>`;
  }
  f.innerHTML=`<div class="caja">
    <div class="tit-sec" style="margin-bottom:14px">${ed?'Editando':'Agregar al banco'}</div>
    ${campos}
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="b3 chico" id="qGuardar" style="--c:var(--menta);--d:var(--menta-d)">${ed?'Guardar cambios':'Agregar'}</button>
      ${ed?'<button class="b3 chico pale" id="qCancelar">Cancelar</button>':''}
    </div></div>`;
  f.querySelector('#qGuardar').onclick=()=>{
    const v1=(f.querySelector('#f1')||{}).value||'';
    const v2=(f.querySelector('#f2')||{}).value||'';
    const v3=(f.querySelector('#f3')||{}).value||'';
    if(!v1.trim()){alert('Falta el campo principal.');return;}
    let item;
    if(cat.tipo==='qa'){
      if(!v2.trim()){alert('Falta la respuesta.');return;}
      item={q:v1.trim(),a:v2.trim(),r:v3.trim()};
    }
    else if(cat.tipo==='cita')item={c:v1.trim(),d:v2.trim()};
    else if(cat.tipo==='testamento')item={n:v1.trim(),t:v2==='nt'?'nt':'at'};
    else if(cat.tipo==='coro')item={p:v1.trim().toUpperCase()};
    else if(cat.tipo==='pistas'){
      const ps=v2.split('\n').map(x=>x.trim()).filter(Boolean);
      if(ps.length!==PISTAS_REQ){alert('Debes escribir exactamente '+PISTAS_REQ+' pistas (escribiste '+ps.length+').');return;}
      item={n:v1.trim(),p:ps};
    }
    if(editIdx!==null)BANCO[cat.k][editIdx]=item;else BANCO[cat.k].push(item);
    editIdx=null;guardarDatos();pintarAdminCats();pintarDetalle();
  };
  const qc=f.querySelector('#qCancelar');
  if(qc)qc.onclick=()=>{editIdx=null;pintarDetalle();};
}
function pintarListaQ(cat){
  const l=$('#listaQ');l.innerHTML='';
  const lista=BANCO[cat.k];
  if(!lista.length){l.innerHTML='<p class="nota">Todavía no hay elementos. Agrega el primero arriba.</p>';return;}
  lista.forEach((it,i)=>{
    let p='',a='';
    if(cat.tipo==='qa'){p=it.q;a=it.a+(it.r?' — '+it.r:'');}
    else if(cat.tipo==='cita'){p=it.c;a=it.d||'';}
    else if(cat.tipo==='testamento'){p=it.n;a=it.t==='nt'?'Nuevo Testamento':'Antiguo Testamento';}
    else if(cat.tipo==='coro')p=it.p;
    else if(cat.tipo==='pistas'){p=it.n;a=it.p.length+' pistas: '+it.p[0];}
    const d=document.createElement('div');d.className='q-i';
    d.innerHTML=`<span class="n">${i+1}</span>
      <span class="tx"><span class="p">${esc(p)}</span>${a?`<span class="a">${esc(a)}</span>`:''}</span>
      <span class="acc">${cat.orden==='fijo'?`<button class="mini" data-s="${i}" title="Subir">↑</button>
      <button class="mini" data-b="${i}" title="Bajar">↓</button>`:''}
      <button class="mini" data-e="${i}">Editar</button>
      <button class="mini" data-d="${i}" style="background:#FFE3E8;color:var(--coral)">Borrar</button></span>`;
    const mover=(de,a)=>{if(a<0||a>=lista.length)return;
      const x=lista.splice(de,1)[0];lista.splice(a,0,x);guardarDatos();pintarDetalle();};
    if(d.querySelector('[data-s]'))d.querySelector('[data-s]').onclick=()=>mover(i,i-1);
    if(d.querySelector('[data-b]'))d.querySelector('[data-b]').onclick=()=>mover(i,i+1);
    d.querySelector('[data-e]').onclick=()=>{editIdx=i;pintarDetalle();window.scrollTo(0,0);};
    d.querySelector('[data-d]').onclick=()=>{
      if(confirm('¿Borrar este elemento?')){lista.splice(i,1);guardarDatos();pintarAdminCats();pintarDetalle();}
    };
    l.appendChild(d);
  });
}
function editorCategoria(cat){
  const nueva=!cat;
  const c0=cat||{n:'',ic:'⭐',modo:'turno',tipo:'qa',color:PALETA[0],reloj:true,activa:true};
  const c=modal(`<div class="cab" style="${cv(c0.color)}"><span class="ic">${c0.ic}</span>
      <h2>${nueva?'Nueva categoría':'Editar categoría'}</h2></div>
    <div class="cont">
      <div style="display:grid;grid-template-columns:110px 1fr;gap:14px">
        <div class="campo"><label>Ícono</label><input type="text" id="cIc" value="${esc(c0.ic)}" maxlength="4" style="font-size:26px;text-align:center"></div>
        <div class="campo"><label>Nombre</label><input type="text" id="cN" value="${esc(c0.n)}" placeholder="Ej.: Milagros de Jesús"></div>
      </div>
      <div class="campo"><label>Tipo de tarjeta</label><select id="cT">
        ${Object.entries(TIPOS).map(([k,v])=>`<option value="${k}"${c0.tipo===k?' selected':''}>${v.n}</option>`).join('')}
      </select><p class="nota" style="margin-top:8px" id="cTds">${TIPOS[c0.tipo].ds}</p></div>
      <div class="campo"><label>¿Quién puede ganar el punto?</label><select id="cM">
        <option value="turno"${c0.modo==='turno'?' selected':''}>Solo el equipo en turno</option>
        <option value="abierto"${c0.modo==='abierto'?' selected':''}>Cualquier equipo (punto abierto)</option>
      </select></div>
      <div class="campo"><label>Color</label><div class="sw" id="cC"></div></div>
      <div class="campo" id="campoOrden"><label>Orden de las preguntas</label><div class="chips">
        <button class="chip${c0.orden!=='fijo'?' on':''}" id="cO1">Al azar</button>
        <button class="chip${c0.orden==='fijo'?' on':''}" id="cO2">En orden de la lista</button>
      </div></div>
      <div class="campo"><div class="chips">
        <button class="chip${c0.activa!==false?' on':''}" id="cA" style="${c0.activa!==false?'background:var(--menta);color:#fff':''}">Visible</button>
      </div></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="b3" id="cGuardar" style="--c:var(--menta);--d:var(--menta-d)">${nueva?'Crear categoría':'Guardar'}</button>
        <button class="b3 pale" id="cCancelar">Cancelar</button>
      </div></div>`,660);
  let color=c0.color,activa=c0.activa!==false,orden=c0.orden==='fijo'?'fijo':'azar';
  const pintaOrden=()=>{
    const a=c.querySelector('#cO1'),b=c.querySelector('#cO2');
    a.classList.toggle('on',orden==='azar');b.classList.toggle('on',orden==='fijo');
    a.style.cssText=orden==='azar'?'background:var(--violeta);color:#fff':'';
    b.style.cssText=orden==='fijo'?'background:var(--violeta);color:#fff':'';
  };
  const sw=c.querySelector('#cC');
  PALETA.forEach(col=>{
    const b=document.createElement('button');b.style.background=col;b.style.boxShadow='0 4px 0 '+osc(col);
    if(col===color)b.classList.add('on');
    b.onclick=()=>{color=col;sw.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
      c.querySelector('.cab').style.cssText=cv(col);};
    sw.appendChild(b);
  });
  c.querySelector('#cT').onchange=e=>{c.querySelector('#cTds').textContent=TIPOS[e.target.value].ds;};
  c.querySelector('#cIc').oninput=e=>{c.querySelector('.cab .ic').textContent=e.target.value||'⭐';};
  c.querySelector('#cO1').onclick=()=>{orden='azar';pintaOrden();};
  c.querySelector('#cO2').onclick=()=>{orden='fijo';pintaOrden();};
  pintaOrden();
  const verOrden=()=>c.querySelector('#campoOrden').classList.toggle('oculto',c.querySelector('#cT').value==='moderador');
  verOrden();
  c.querySelector('#cT').addEventListener('change',verOrden);
  c.querySelector('#cA').onclick=e=>{activa=!activa;e.target.classList.toggle('on',activa);
    e.target.style.cssText=activa?'background:var(--menta);color:#fff':'';};
  c.querySelector('#cCancelar').onclick=cerrarModal;
  c.querySelector('#cGuardar').onclick=()=>{
    const n=c.querySelector('#cN').value.trim();
    if(!n){alert('Ponle nombre a la categoría.');return;}
    const tipo=c.querySelector('#cT').value,modo=c.querySelector('#cM').value;
    const ic=c.querySelector('#cIc').value.trim()||'⭐';
    if(nueva){
      const k='cat'+Date.now();
      CATS.push({k,n,ic,modo,tipo,color,orden,activa});
      BANCO[k]=[];adminK=k;
    }else{
      if(cat.tipo!==tipo&&(BANCO[cat.k]||[]).length&&
         !confirm('Cambiar el tipo dejará las preguntas actuales sin usarse. ¿Continuar?'))return;
      if(cat.tipo!==tipo)BANCO[cat.k]=[];
      Object.assign(cat,{n,ic,modo,tipo,color,orden,activa});
    }
    editIdx=null;guardarDatos();cerrarModal();pintarAdminCats();pintarDetalle();
  };
}
$('#btnNuevaCat').onclick=()=>editorCategoria(null);
$('#btnExportar').onclick=()=>{
  const blob=new Blob([JSON.stringify({cats:CATS,banco:BANCO,poderes:CONF_PODERES},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='carrera-biblica-preguntas.json';a.click();
};
$('#btnEditarPoderes').onclick=()=>editorPoderes();
function editorPoderes(){
  const c=modal(`<div class="cab" style="${cv('#6C3BF4')}"><span class="ic">🎲</span><h2>Poderes y bloqueos</h2>
      <span class="modo" id="totPod"></span></div>
    <div class="cont">
      <div class="aviso">Decide cuántos números escondidos tendrá cada poder. Se reparten al azar cada vez que empieza una partida.</div>
      <div id="listaPod"></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">
        <button class="b3" id="podOk" style="--c:var(--menta);--d:var(--menta-d)">Guardar</button>
        <button class="b3 pale" id="podDef">Volver a los valores por defecto</button>
        <button class="b3 pale" id="podCerrar">Cerrar</button>
      </div></div>`,760);
  const pinta=()=>{
    c.querySelector('#totPod').textContent=totalMazo()+' números';
    c.querySelector('#listaPod').innerHTML='';
    CAT_PODERES.forEach(p=>{
      const q=cantPoder(p);
      const d=document.createElement('div');d.className='pod-fila';
      d.innerHTML=`<span class="pi">${p.ic}</span>
        <span class="pt"><b>${p.tt}</b><i>${p.ds}</i></span>
        <span style="display:flex;align-items:center;gap:8px">
          <button class="mini" data-m="-">−</button>
          <b style="min-width:26px;text-align:center;display:inline-block;font-size:17px">${q}</b>
          <button class="mini" data-m="+">+</button></span>`;
      d.querySelector('[data-m="-"]').onclick=()=>{CONF_PODERES[p.id]=Math.max(0,q-1);pinta();};
      d.querySelector('[data-m="+"]').onclick=()=>{CONF_PODERES[p.id]=Math.min(20,q+1);pinta();};
      c.querySelector('#listaPod').appendChild(d);
    });
  };
  pinta();
  c.querySelector('#podDef').onclick=()=>{CONF_PODERES={};pinta();};
  c.querySelector('#podCerrar').onclick=cerrarModal;
  c.querySelector('#podOk').onclick=()=>{
    if(totalMazo()<8){alert('Necesitas al menos 8 números en total.');return;}
    guardarDatos();
    if(S.equipos.length&&!S.fin){S.mazo=armarMazo();S.casillasUsadas=[];guardar();}
    cerrarModal();toast('Poderes guardados: '+totalMazo()+' números');
  };
}
$('#btnFabrica').onclick=()=>{
  if(!confirm('Esto reemplaza TODAS las categorías y preguntas por las originales del juego. Se perderá lo que hayas agregado. ¿Continuar?'))return;
  CATS=JSON.parse(JSON.stringify(CATS_DEF));BANCO=JSON.parse(JSON.stringify(BANCO_DEF));CONF_PODERES={};
  adminK=CATS[0].k;editIdx=null;guardarDatos();pintarAdminCats();pintarDetalle();
};
$('#btnImportar').onclick=()=>$('#fileImport').click();
$('#fileImport').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.cats||!d.banco)throw new Error('El archivo no tiene el formato esperado.');
      CATS=d.cats;BANCO=d.banco;CONF_PODERES=d.poderes||{};adminK=CATS.length?CATS[0].k:null;
      guardarDatos();pintarAdminCats();pintarDetalle();
      alert('Respaldo cargado: '+CATS.length+' categorías.');
    }catch(err){alert('No se pudo leer el archivo. '+err.message);}
    e.target.value='';
  };
  r.readAsText(f);
};

/* ============ CUENTA (Supabase Auth + sincronización en la nube) ============
   Diseño:
   - Sin iniciar sesión: el juego funciona exactamente igual que siempre, guardando
     categorías/preguntas/poderes solo en localStorage de este navegador.
   - Al iniciar sesión: se cargan (o se crean, la primera vez) los datos de ESE
     usuario desde Supabase (tabla user_game_data, protegida con Row Level Security
     para que cada usuario solo pueda leer/escribir su propia fila). A partir de ahí,
     cada vez que se guardan datos también se sincronizan a la nube (con un pequeño
     "debounce" para no golpear la base de datos en cada tecla).
   - Nunca se maneja aquí ninguna contraseña en texto plano fuera del propio flujo de
     Supabase Auth, y nunca se usa la service_role key (no existe en este proyecto). */
let sesionActual=null;
let timerGuardadoNube=null;

function programarGuardadoNube(){
  if(!supabase||!sesionActual)return;
  clearTimeout(timerGuardadoNube);
  timerGuardadoNube=setTimeout(guardarDatosNube,700);
}
async function guardarDatosNube(){
  if(!supabase||!sesionActual)return;
  const payload={cats:CATS,banco:BANCO,poderes:CONF_PODERES};
  const {error}=await supabase.from('user_game_data')
    .upsert({user_id:sesionActual.user.id,data:payload},{onConflict:'user_id'});
  if(error)console.error('[carrera-biblica] Error guardando en la nube:',error.message);
}
async function cargarDatosNube(){
  if(!supabase||!sesionActual)return;
  const {data,error}=await supabase.from('user_game_data')
    .select('data').eq('user_id',sesionActual.user.id).maybeSingle();
  if(error){console.error('[carrera-biblica] Error leyendo la nube:',error.message);return;}
  if(data&&data.data&&Array.isArray(data.data.cats)&&data.data.cats.length){
    CATS=data.data.cats;BANCO=data.data.banco||{};CONF_PODERES=data.data.poderes||{};
  }else{
    /* primera vez de este usuario: sembramos su cuenta con lo que tiene ahora
       (por defecto, las categorías originales del juego) */
    await guardarDatosNube();
  }
  ls.set('cbPersDatos',{cats:CATS,banco:BANCO,poderes:CONF_PODERES});
  pintarChipsCats();
  const pAdmin=$('#pAdmin');
  if(pAdmin&&!pAdmin.classList.contains('oculto')){
    if(!catDe(adminK))adminK=CATS.length?CATS[0].k:null;
    pintarAdminCats();pintarDetalle();
  }
}
function renderCuentaBtns(){
  const activo=Boolean(sesionActual);
  const txt=activo?('👤 '+sesionActual.user.email):'Iniciar sesión';
  ['#btnCuenta','#btnCuenta2'].forEach(sel=>{
    const b=$(sel);if(!b)return;
    b.textContent=txt;b.onclick=abrirCuenta;
  });
}
async function crearCuenta(email,password,onError){
  if(!supabase){onError&&onError('La sincronización en la nube no está configurada todavía.');return;}
  const {error}=await supabase.auth.signUp({email,password});
  if(error){onError&&onError(error.message);return;}
  toast('✉️ Revisa tu correo para confirmar la cuenta');
  cerrarModal();
}
async function iniciarSesion(email,password,onError){
  if(!supabase){onError&&onError('La sincronización en la nube no está configurada todavía.');return;}
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error){onError&&onError(error.message);return;}
  cerrarModal();toast('Sesión iniciada');
}
async function cerrarSesion(){
  if(!supabase)return;
  await supabase.auth.signOut();
  toast('Sesión cerrada');
}
function abrirCuenta(){
  if(sesionActual){
    const c=modal(`<div class="cab" style="${cv('#6C3BF4')}"><span class="ic">👤</span><h2>Mi cuenta</h2></div>
      <div class="cont">
        <p class="nota"><b>${esc(sesionActual.user.email)}</b></p>
        <p class="nota">Tus categorías y preguntas propias se guardan en la nube: estarán disponibles en cualquier dispositivo donde inicies sesión con esta cuenta.</p>
        <button class="b3 pale" id="btnSalir" style="margin-top:14px">Cerrar sesión</button>
      </div>`,480);
    c.querySelector('#btnSalir').onclick=async()=>{await cerrarSesion();cerrarModal();};
    return;
  }
  const c=modal(`<div class="cab" style="${cv('#6C3BF4')}"><span class="ic">👤</span><h2>Mi cuenta</h2></div>
    <div class="cont">
      <p class="nota">Inicia sesión para guardar tus propias categorías y preguntas en la nube. Sin cuenta, el juego funciona igual, pero solo se guarda en este dispositivo.</p>
      <div class="campo"><label>Correo</label><input type="email" id="cuEmail" autocomplete="email"></div>
      <div class="campo"><label>Contraseña (mínimo 8 caracteres)</label><input type="password" id="cuPass" autocomplete="current-password" minlength="8"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="b3" id="cuEntrar" style="--c:var(--menta);--d:var(--menta-d)">Iniciar sesión</button>
        <button class="b3 pale" id="cuCrear">Crear cuenta</button>
      </div>
      <p class="nota" id="cuMsg" style="margin-top:14px"></p>
    </div>`,480);
  const msg=c.querySelector('#cuMsg');
  const leer=()=>({email:c.querySelector('#cuEmail').value.trim(),pass:c.querySelector('#cuPass').value});
  c.querySelector('#cuEntrar').onclick=()=>{
    const {email,pass}=leer();
    if(!email||pass.length<8){msg.textContent='Escribe un correo y una contraseña de al menos 8 caracteres.';return;}
    msg.textContent='Entrando…';
    iniciarSesion(email,pass,m=>{msg.textContent=m;});
  };
  c.querySelector('#cuCrear').onclick=()=>{
    const {email,pass}=leer();
    if(!email||pass.length<8){msg.textContent='Escribe un correo y una contraseña de al menos 8 caracteres.';return;}
    msg.textContent='Creando cuenta…';
    crearCuenta(email,pass,m=>{msg.textContent=m;});
  };
}
renderCuentaBtns();
if(supabase){
  supabase.auth.getSession().then(({data})=>{
    sesionActual=data.session;renderCuentaBtns();
    if(sesionActual)cargarDatosNube();
  });
  supabase.auth.onAuthStateChange((_event,session)=>{
    sesionActual=session;renderCuentaBtns();
    if(session)cargarDatosNube();
  });
}

/* ============ INICIO ============ */
(function init(){
  const datos=ls.get('cbPersDatos');
  if(datos&&datos.cats&&datos.cats.length){CATS=datos.cats;BANCO=datos.banco||{};CONF_PODERES=datos.poderes||{};}
  pintarConfig();pintarChipsCats();
  const prev=ls.get('cbPersJuego');
  if(prev&&prev.equipos&&prev.equipos.length&&!prev.fin){
    const c=modal(`<div class="cab" style="${cv('#6C3BF4')}"><span class="ic">↩️</span><h2>Partida sin terminar</h2></div>
      <div class="cont"><p class="nota">Ronda ${prev.ronda} de ${prev.rondas}, con ${prev.equipos.length} equipos.</p>
      <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
        <button class="b3" id="rcSi">Continuar</button>
        <button class="b3 pale" id="rcNo">Empezar de nuevo</button></div></div>`,560);
    c.querySelector('#rcSi').onclick=()=>{
      S=Object.assign(S,prev);
      if(!S.mazo||!S.mazo.length){S.mazo=armarMazo();S.casillasUsadas=[];}
      S.equipos.forEach((e,i)=>{if(e.posVis===undefined)e.posVis=e.pos;if(e.puntos===undefined)e.puntos=0;
        if(!e.color)e.color=colorEq(i);});
      cerrarModal();irA('pJuego');
      $('#rondaT').textContent=S.rondas;$('#turnoT').textContent=S.equipos.length;
      pintarEquipos();pintarCats();pintarTurno();pintarMod();
    };
    c.querySelector('#rcNo').onclick=()=>{ls.del('cbPersJuego');cerrarModal();};
  }
})();
