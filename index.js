const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());







// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // database collection
        const allData = client.db('assignment-12').collection('allData')
        const trandingData = client.db('assignment-12').collection('TrandingData')

        await client.connect();
        app.get('/', async (req, res) => {
            res.send('hello')
        })
        // allData
        app.get('/data', async(req, res) => {
            const search = req.query.search || '';
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 6
            console.log(search,page);
            const query={
                tags:{ $regex: new RegExp(search, 'i') }
            }
            const cursor = allData.find(query).sort({ date: -1, star: 1 });
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/trandingData', async(req, res) => {
            const cursor = trandingData.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/details/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id: new ObjectId(id)}
            const result=await allData.findOne(query);
            res.send(result)
        })
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`assignment 12 running on:${port}`)
})
