const express = require("express");
const bodyParser = require("body-parser");
const {MongoClient} = require("mongodb");
const path = require("path");

const app = express();
// tell server where to serve static files from
app.use(express.static(path.join(__dirname,'/build')) );

app.use(bodyParser.json());
// refactoring repeated db code
const withDB = async (operations, res)=>{
    const mongoclient = new MongoClient('mongodb://localhost:27017',{useNewUrlParser:true});
    try {
        await mongoclient.connect();
        const db = mongoclient.db('my-blog');
        await operations(db);
        await client.close(); 
    } catch (error) {
        res.status(500).json({message:'Error connecting to db',error});
    }
}
// //endpoints
app.get('/api/articles/:name',async (req,res)=>{
   withDB(async (db)=>{
    const articleName =req.params.name;
    //find article with this.name info
    const articleInfo = await db.collection('articles').findOne({name:articleName});
    res.status(200).json(articleInfo);
   },res); 
});
//find query, update and send an upvote
app.post('/api/articles/:name/upvote',async(req,res)=>{
    withDB(async (db)=>{
        const articleName =req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        //query to increment number of upvotes in the db
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                upvotes: articleInfo.upvotes + 1,
            },
        });
        //get updated info
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
})   
// //push comments and into database 
app.post('/api/articles/:name/add-comment',async (req, res)=>{
    
        const {username, text}= req.body;
        const articleName =req.params.name;
       withDB(async(db)=>{
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        //query to increment number of upvotes in the db
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments: articleInfo.comments.concat({username, text}),
            },
        })
        //get updated info
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
       },res);
        
}); 
// all requests caught by other API routes should be passed onto the app
app.get('*',(req, res)=>{
    res.sendFile(path.join(__dirname+'/build/index.html'));
})
app.listen(8000,()=>console.log("Listening on port 8000"));

  