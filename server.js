const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'lorem'
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const mongoose = require('mongoose')
app.use(express.json())
const path = require('path')

const User = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },

})

const Task = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    status:{
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: 'pending'
    },
    dueDate: {
        type: Date,
        default: Date.now
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
    }
})

function authenticateToken(req, res, next){
    const token = req.cookies.token
    if(!token){
        res.send('Unauthorized!')
    }else{
        jwt.verify(token, SECRET_KEY, (err, user)=>{
            if(err){
                res.send("Error")
            }else{
                req.user = user
                next()
            }
        })
    }
}

mongoose.connect('mongodb+srv://fsd:hi789@cluster1.3ifw6bo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1')
.then(()=>{console.log("MongoDB Connected")})
.catch((err)=>{console.log("Failed to Connect to MongoDB")})


const user = new mongoose.model('user', User);
const task = new mongoose.model('task', Task);


app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/register', async(req, res)=>{
    const u = await user.create(req.body);
    res.json({ message: "User registered successfully" });
    console.log(u);
});


app.post('/api/login', async(req, res)=>{
    const {email, password} = req.body;
    const test = await user.findOne({email});
    if(test == null){
        res.send("Invalid Email!");
    }
    else{
        if(test.password == password){
            const token = jwt.sign({id: test._id, email: test.email}, SECRET_KEY, {expiresIn: '1h'});
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 60 * 60 * 1000
            })
            res.json({message: "Login Successful", token: token});
        }else{
            res.send("Wrong password!");
        }
    }
});


app.post('/api/tasks', authenticateToken, async(req, res)=>{
    const t = req.body
    t.assignedTo = req.user.id
    const t1 = await task.create(t)
    res.json({message: "Task created successfully"});
});

app.get('/api/tasks', authenticateToken, async(req, res)=>{
    const t = await task.find({assignedTo: req.user.id})
    res.send(t);
});

app.get('/api/tasks/:id', authenticateToken, async(req, res)=>{
    const id = req.params.id
    const t = await task.findById(id)
    res.send(t);
});

app.put('/api/tasks/:id', authenticateToken, async(req, res)=>{
    const id = req.params.id
    const t = await task.findByIdAndUpdate(id, req.body, {new: true})
    res.json({message :"Updated Successfully!"});
});

app.delete('/api/tasks/:id', authenticateToken, async(req, res)=>{
    const id = req.params.id
    await task.findByIdAndDelete(id)
    res.json({message: "Deleted Successfully!"})
});

app.listen(3000, ()=>{console.log("Server running on port 3000")})