# Create a Quiz Game

First, before we see how to create a quiz game, we have to know that we have two types of quiz games **Normal Games** and **Custom Games**.
The only difference between them is that Normal Games are affected by the quiz configuration and the other not.

## How to create a normal game

To create a normal quiz game, you need to use discord slash command [/create_quizgame](../commands/create_quizgame), pretty simple isn't it :)

## How to create a Custom Games

To create a custom quiz game,you need to create a new channel and name it like this :
<br/>
`(quiz category)-(questions amount)-(max players)`

if you want to choose the difficulty or the time for each question, you can add theme like this :
<br/>
`(quiz category)-(questions amount)-(max players)-(difficulty)-(time)`
<br/>
or like this :
<br/>
`(quiz category)-(questions amount)-(max players)-(time)-(difficulty)`

**note** : the time and the difficulty are optional,so you can ignore them while naming the channel or you can just add one of them.<br>
**note** : the time options are **5, 10, 15, 30 or 45**<br>
**note** : the difficulty options are **easy, medium or hard**<br>

**example** : <br/>
let's say you want to create a game with this settings :<br/>
**category** => video games <br/> **questions amount** => 10 <br/> **max players** => 15 <br/>
the channel name must be like this : **videogames-10-15** <br/>
Well you might want to choose the time and you want it to be 10 seconds for each question, so the channel name will be like this : **videogames-10-15-10** <br/>
And if you are so smart and you want to make the difficulty hard, you are just gonna add the "hard" word like this : **videogames-10-15-10-hard**

After setting the channel's name you can create it or set it private then create it's up to you.
Once you create the channel the bot will automatically rename it to `🟡 waiting` and you will see the game announcement in the new channel.

If it didn't work for you, you must make sure that [custome games](../config/quiz/custom-games.md) configuration is enabled and check the channel name it may be wrong.

## Test

let's see if you know how to create one.

name a game channel with these settings :<br>
**category** : General Knowledge<br>
**questions amount** : 7<br>
**max players** : 19<br>
**difficulty** : medium<br>

<details>
  <summary>Answer</summary>
  
  **generalknowledge-7-19-medium**
</details>

<br>

**category** : Films<br>
**questions amount** : 9<br>
**max players** : 17<br>
**difficulty** : Easy<br>
**time** : 15 seconds

<details>
    <summary>Answer</summary>

**films-9-17-easy-15** <br>
or <br>
**films-9-17-15-easy**

</details>

<br>

**max players** : 3<br>
**category** : Random<br>
**questions amount** : 5<br>

<details>
    <summary>Answer</summary>
    
   **random-5-3** 
</details>
