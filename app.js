/*-----------------------------------------------------------------------------
A simple Poeter Helper bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var cnt = -1;
var cs='';
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);




// DEFAULT MESSAGES ----------------------------------

var bot = new builder.UniversalBot(connector, function (session, args) {
   
      var word = session.message.text; // read the message of the user 
      cnt=cnt+1;
      if (word) {
           var fs = require('fs');
           var url1 = 'http://www.cleverbot.com/getreply?key=CC7zpTR3NhyT0iwUuW6wyBNYHfQ&input='; // create the url
           var url2 = '&cs=' + cs;

           var request = require('request');
           var http = require('http');
           if(cnt==7) 
           cnt=0;
           if(cnt==0) // for the first call 
           {
               request(url1+word, function (error, response, body) {
           
               if (!error && response.statusCode == 200) {
                var importedJSON = JSON.parse(body);
                cs=importedJSON.cs;
                session.send(importedJSON.output);   // print the message 
            }else{
                session.sendTyping();
                session.send("Out of Town. Talk later !!!");} 
                 })
           }
           else
           {
               request(url1+word+url2, function (error, response, body) {
               if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               cs=importedJSON.cs;
               session.sendTyping();
               session.send(importedJSON.output);
            }else{
                session.send("I apologize. Sometimes I don't like to listen to you !");
                session.send("I was kidding");
                }
                 })
           }
           } else {
             // Rerequesting for query
             session.send('Pardon me.');
        }
});


bot.set('storage', tableStorage);

// Make sure you add code to validate these fields

var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
// The LUIS url --need to be changed if limit got fulfilled
const LuisModelUrl = 'https://eastus.api.cognitive.microsoft.com/luis/v2.0/apps/0e32e0c6-b9e1-440f-969e-6d69b88dcaf4?subscription-key=d45d1df23a214c65b4f2a23f16aa3ea5&spellCheck=true&bing-spell-check-subscription-key=919e0bed4abd4cc5899f8fec26f4bef4&verbose=true&timezoneOffset=0&q=';

// Main dialog with LUIS

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

//MEANING OF WORD ---------------------------------------

bot.dialog('Meaning',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'word');

        if (Word) {
            var fs = require('fs');
            var url1 = 'http://api.wordnik.com/v4/word.json/';
            var word=Word.entity;
            var url2 = '/definitions?limit=200&includeRelated=true&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
            var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("%s\n",importedJSON[0].text);
               else session.send("We are unable to find a meaning.");
            }else{
                session.send("Sorry, I couldn't find the meaning!");}
                 })
            } else {

                session.send('Aw Snap !!');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'identify'
})

//EXAMPLE OF WORD ------------------------------------------------

bot.dialog('example',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'tope');

        if (Word) {
            var fs = require('fs');
            var url1  ="http://api.wordnik.com:80/v4/word.json/";
            var word =Word.entity;
            var url2="/topExample?useCanonical=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
            var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON) session.say(importedJSON.text);
               else session.send("We are unable to find a example.");
            }else{
                session.send("No example found... I will try to learn more!");}
            })
            } else {

                session.send('Sorry for this time... ');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'topExamples'
})

//SYNONYMS --------------------------------------------------

bot.dialog('synonyms',
    (session, args) => {
        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'word');

        if (Word) {
        
           var fs = require('fs');
           var url1 = "http://api.wordnik.com:80/v4/word.json/";
           var word = Word.entity;
           var url2 = "/relatedWords?useCanonical=true&relationshipTypes=synonym&limitPerRelationshipType=10&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
           var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("%s, %s",importedJSON[0].words[0],importedJSON[0].words[1]);
               else session.send("Cannot find synonyms.");
            }else{
                session.send("Not able to find :(");}
            })
         } else {
                    session.send('I do not want to answer that xD');
                }
        session.endDialog();
    }
).triggerAction({
    matches: 'relatedWords'
})

//OPPOSITE WORDS --------------------------------------------------

bot.dialog('opposite',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'anton');

        if (Word) {     
            var fs = require('fs');
            var url1 = "http://api.wordnik.com:80/v4/word.json/";
            var word = Word.entity;
            var url2="/relatedWords?useCanonical=true&relationshipTypes=antonym&limitPerRelationshipType=10&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
            
           var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("%s\n",importedJSON[0].words[0]);
               else session.send("We are unable to find a antonym.");
            }else{
                session.send("Sorry, I couldn't find the opposite !");}
            })
         } else {
                session.send('I’m so sorry and it won’t happen again.');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'antonyms'
})

//MANY TO ONE -------------------------------------------------------

bot.dialog('oneWord',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'sentence');

        if (Word) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?ml=";
            var word = Word.entity.replace(/\s/g,'+');
            
           var request = require('request');
            request(url1+word, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("I think you are lookinng for - '%s'.",importedJSON[0].word);
               else session.send("Cannot find a suitable word.");      
            }else{
                session.send("ERROR 404 - Word not found :)");}
            })
         } else {
                session.send('Try something another !!');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'ManyToOne'
})

//WORDLETTER ------------------------------------------

bot.dialog('letter',
    (session, args) => {

        var intent = args.intent;
        var letter = builder.EntityRecognizer.findEntity(intent.entities, 'Letter');
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'word');
      
        if (Word && letter) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?ml=";
            var word1 = Word.entity;
            var word2 = letter.entity;
            
           var request = require('request');
            request(url1+word1+'&sp='+word2+'*&max=3', function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("I think you are looking for '%s'.",importedJSON[0].word);
               else session.send("Failed to find a suitable word.");           
            }else{
                session.send("Did not get that !");}
            })
         } else {
                session.send('Sorry, Dear\nTest me with another question !!');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'WordLetter'
})  

//RANDOM WORD -----------------------------------------------------

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

bot.dialog('randomWord',
    (session, args) => {
            var fs = require('fs');
            var url1 = "http://api.wordnik.com:80/v4/words.json/wordOfTheDay?date=";
            var word = randomDate(new Date(2012, 0, 1), new Date()).toISOString();
            var url2="&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
           var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               session.send(importedJSON.word);
               session.send("The meaning is - %s",importedJSON.note);
               session.send("The example for this word is - %s",importedJSON.examples[0].text);
            }else{
                session.send("No random word found");}
            })
        session.endDialog();
    }
).triggerAction({
    matches: 'RandomWord'
})

//PRONOUNCE -----------------------------------------------------

bot.dialog('Pronounce',
    (session, args) => {
        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'pron');

        if (Word) {
            var fs = require('fs');
            var url1 = "http://api.wordnik.com:80/v4/word.json/";
            var word = Word.entity;
            var url2="/pronunciations?useCanonical=true&limit=50&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
            var request = require('request');
            request(url1+word+url2, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0].raw)
               {
                    var pronounceVar = importedJSON[0].raw;
                     var fs = require('fs');
                    var url1 = "http://api.wordnik.com/v4/word.json/";
                    var url2="/audio?useCanonical=false&limit=50&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
                    var request = require('request');
                    request(url1+word+url2, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var importedJSON2 = JSON.parse(body);
                            var url = importedJSON2[0].fileUrl;
                            var msg1 = new builder.Message(session);
                            msg1.attachmentLayout(builder.AttachmentLayout.carousel)
                            msg1.attachments([
                                new builder.HeroCard(session)
                                    .title(word)
                                    .text(pronounceVar)
                                    .buttons([
                                        builder.CardAction.playAudio(session, url, "Listen")
                                    ]),
                            ]);
                            session.send(msg1).endDialog();
                            
                        }
                        })
               }
               else
               session.send("Sorry, My bad !!");
            }else{
                session.send("Sorry");}
            })
         } else {
                 session.send('Unable to understand you !');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'pronounce'
})

//RHYME RELATED -----------------------------------------------

bot.dialog('rhymeRealted',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'word');
        var Rhyme = builder.EntityRecognizer.findEntity(intent.entities, 'rhyme');
      
        if (Word && Rhyme) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?ml=";
            var word1 = Word.entity;
            var word2 = Rhyme.entity;
            
           var request = require('request');
            request(url1+word1+'&rel_rhy='+word2+'&max=3', function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("I think you are looking for '%s'.",importedJSON[0].word);
               else session.send("Cannot find a word.");
            }else{
                session.send("I think I haven't learnt it till now");}
            })
         } else {
                session.send('Unable to find word\n I will try to learn more.');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'rhymeWords'
})  

//ADJECTIVE NOUN -----------------------------------------------------

bot.dialog('AdjNoun',
    (session, args) => {
        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'nounw');

        if (Word) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?rel_jjb=";
            var word = Word.entity;
            
           var request = require('request');
            request(url1+word, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("%s, %s, %s.",importedJSON[0].word,importedJSON[1].word,importedJSON[2].word);
               else session.send("Cannot find a word.");           
            }else{
                session.send("Sorry");}
            })
         } else {
                session.send('Did not get you :( ');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'adjectiveNoun'
})

//NOUN TO ADJECTIVE ---------------------------------------------------

bot.dialog('nounAjct',
    (session, args) => {

        var intent = args.intent;
        var Word = builder.EntityRecognizer.findEntity(intent.entities, 'adject');

        if (Word) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?rel_jja=";
            var word = Word.entity;
            
           var request = require('request');
            request(url1+word, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) session.send("%s, %s, %s.",importedJSON[0].word,importedJSON[1].word,importedJSON[2].word);
               else session.send("We are unable to find a required word.");           
            }else{
                session.send("Sorry, my bad");}
            })
         } else {
                session.send('Sorry for this, challenge me with another task');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'nounAdjective'
})

//RHYMING WORDS -------------------------------------------------

bot.dialog('rhym',
    (session, args) => {

        var intent = args.intent;
        var Rhyme = builder.EntityRecognizer.findEntity(intent.entities, 'rhyme');
      
        if (Rhyme) {
            var fs = require('fs');
            var url1 = "https://api.datamuse.com/words?rel_rhy=";
            var word = Rhyme.entity;
            
           var request = require('request');
            request(url1+word, function (error, response, body) {
            if (!error && response.statusCode == 200) {
               var importedJSON = JSON.parse(body);
               if(importedJSON[0]) {
               var s ='';
               for(var i=0;i<Math.min(importedJSON.length,10);i++)
               {
                   if(i)
                   s=s+', ';
                   s=s+importedJSON[i].word;
               }
               session.send(s);
               }
               else session.send("We are unable to find suitable rhyming words.");
            }else{
                session.send("Sorry, I couldn't find the word for this !");}
            })
         } else {
                session.send('ERROR 403 - You have no access for this query .... :(');
                session.send('Do not take it seriouly I was joking ');
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'findRhyme'
})  

//HELP -------------------------------------------------------------

var cal = 0;

bot.dialog('Help',
    (session, args) => {
        cal=cal+1;
    
    
    if(cal==1) {
        var msg = new builder.Message(session)
	       .text("These are the cool feature that we can do with this bot !!")
	       .suggestedActions(
		      builder.SuggestedActions.create(
				session, [
					builder.CardAction.postBack(session,"meaning**", "Meaning"),
				    builder.CardAction.postBack(session,"rhyme**", "Rhyming"),
                    builder.CardAction.postBack(session,"patil**", "Rhyme with meaning"),
                    builder.CardAction.postBack(session, "synonyms**", "Synonyms"),
					builder.CardAction.postBack(session,"manyToOne**", "One for Many"),
                    builder.CardAction.postBack(session,"antonyms**", "Antonyms"),
                    builder.CardAction.postBack(session, "patel**", "Adj. for noun"),
                    builder.CardAction.postBack(session, "pronounce**", "Pronounce"),
                    builder.CardAction.postBack(session,"timePass**", "Time Pass"),
				    builder.CardAction.postBack(session,"example**", "Example"),
					builder.CardAction.postBack(session, "wordletter**", "Play with Word and Letter"),
					builder.CardAction.postBack(session, "nehru**", "Noun for Adj."),
                    builder.CardAction.postBack(session,"vedic**", "Random Word"),
				]
			));
            session.send(msg).endDialog();
    } else {
        var msg = new builder.Message(session)
            .text("Choose any of the following : ")
	       .suggestedActions(
		      builder.SuggestedActions.create(
    			session, [
    				builder.CardAction.postBack(session,"meaning**", "Meaning"),
				    builder.CardAction.postBack(session,"rhyme**", "Rhyming"),
                    builder.CardAction.postBack(session,"patil**", "Rhyme with meaning"),
                    builder.CardAction.postBack(session, "synonyms**", "Synonyms"),
					builder.CardAction.postBack(session,"manyToOne**", "One for Many"),
                    builder.CardAction.postBack(session,"antonyms**", "Antonyms"),
                    builder.CardAction.postBack(session, "patel**", "Adj. for noun"),
                    builder.CardAction.postBack(session, "pronounce**", "Pronounce"),
                    builder.CardAction.postBack(session,"timePass**", "Time Pass"),
				    builder.CardAction.postBack(session,"example**", "Example"),
					builder.CardAction.postBack(session, "wordletter**", "Play with Word and Letter"),
					builder.CardAction.postBack(session, "nehru**", "Noun for Adj."),
                    builder.CardAction.postBack(session,"vedic**", "Random Word"),
                ]
			));
            session.send(msg).endDialog();
    }
     
    }
).triggerAction({
    matches: 'Help'
}) 

//TOP SECRET STUFF -------------------------------------------

bot.dialog('secret',
    (session, args) => {
    var t = session.message.text;
    if(t=='meaning**')
    session.send("Gives the meaning of a word.\nFor example : 'tell me the meaning of house'");
    else if(t=='rhyme**')
    session.send("Give the rhyming words of the given word.\nFor example : 'give me a word that rhymes with'");
    else if(t=='pronounce**')
    session.send("Gives the correct prononciation of the a given word.\nFor example : 'how to pronounce'");
    else if(t=='timePass**')
    session.send("You can chat with me like a friend :) .");
    else if(t=='example**')
    session.send("This will give the example for the given word in the sentence.\nFor Example : 'give me the example of gift in the sentence'");
    else if(t=='synonyms**')
    session.send("Give the synonyms of a given word.\nFor example : 'what are synonyms of youth'");
    else if(t=='antonyms**')
    session.send("This gives the antonyms of word.\nFor example : 'give me the antonyms for angry'");
    else if(t=='manyToOne**')
    session.send("Sometimes we are trying to get one word for one phrase.\nFor example : 'give me a word which means pain in the head'");
    else if(t=='wordletter**')
    session.send("Playing with word and letter.\nFor example : 'give me a word which means strong and starts with t'");
    else if(t=='vedic**')
    session.send("This will give you a random word and it's meaning to increase your vocabulary\nFor example : 'give me a random word'" );
    else if(t=='patil**')
    session.send("It can be used to find a word that means something and rhyme with a given word.\nFor example : 'give me a word that rhyme with grape that is related to breakfast'");
    else if(t=='nehru**')
    session.send("Give adjectives that can be used with a given noun.\nFor example : ''");
    else if(t=='patel**')
    session.send("Give nouns that can be used with a given adjective.\nFor example : 'give me a adjective that often describes sea'");
    else
    session.send("I am still learning  !!!");
    
     var msg = new builder.Message(session)
     .text("Try another?? ")
	.suggestedActions(
		builder.SuggestedActions.create(
				session, [
					builder.CardAction.postBack(session,"what can you do for me ?", "Look for other features"),
				]
			));
    session.send(msg).endDialog();
    }
   
).triggerAction({
    matches: 'secretMessage'
})  