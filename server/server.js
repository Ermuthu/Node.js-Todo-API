require('./config/config');

const _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var {ObjectID} = require('mongodb');


var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

var port = process.env.PORT;
var app = express();


app.use(bodyParser.json());

app.post('/todos',(req,res)=>{

  var todo = new Todo({
    name : req.body.name,
    age : req.body.age,
  });
  todo.save().then((doc)=>{
    res.send(doc);
  },(err)=>{
    res.status(400).send(err);
  });
});

app.get('/todos',(req,res)=>{
  Todo.find().then((result)=>{
    res.send({result});
  },(e)=>{
    res.status(400).send(e);
  })
})

app.post('/users',(req,res)=>{
  var body = _.pick(req.body,['email','password']);

   var user = new User(body)
  user.save().then(()=>{
    return user.generateAuthToken();
  }).then((token)=>{
    res.header('x-auth',token).send(user);
  }).catch((e)=>{
    res.status(400).send(e);
  })

app.get('/users/me',authenticate,(req,res)=>{
  res.send(req.user);
})


});

app.get('/todos/:id',(req,res)=>{
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send(`Id is not valid ${id}`);
  }
  Todo.findById(id).then((result)=>{
    if(!result){
    return  res.status(404).send(result);
    }
    res.send({result});
  }).catch((e)=> res.status(404).send({}))
})

app.delete('/todos/:id',(req,res)=>{
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    res.status(404).send(`Id is not valid ${id}`);
  }
  Todo.findByIdAndRemove(id).then((result)=>{
    if(!result){
      res.status(404).send('no collection is deleted');
    }
    res.send({result});
  }).catch((e)=>res.status(400).send({}))
})

app.patch('/todos/:id',(req,res)=>{
  var id = req.params.id;
  var body = _.pick(req.body,['name','age','male'])

  if(!ObjectID.isValid(id)){
    return res.status(404).send(`Id is not valid ${id}`);
  }

  if(_.isBoolean(body.male)&&body.male){
    body.changedAt = new Date().getTime();
  }
  else{
    body.changedAt = null;
    body.male = false;
  }
 Todo.findByIdAndUpdate(id,{$set :body},{new:true}).then((result)=>{
   if(!result){
     return res.status(404).send({});
   }
   res.send({result});
 }).catch((e)=>{
   res.status(400).send();
 })

})

app.listen(3000,()=>{
  console.log(`Server is up on port: ${port}`);
})

module.exports = {app} ;
