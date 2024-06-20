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
        const review = client.db('assignment-12').collection('Reviews')

        await client.connect();
        app.get('/', async (req, res) => {
            res.send('assignment-12 running....')
        })
        // allData only for feature and trandig section
        app.get('/data', async (req, res) => {

            const cursor = allData.find().sort({ date: -1, star: 1 });
            const result = await cursor.toArray();
            res.send(result)
        })
        // try to do upvote

        // data for all product with pagination
        app.get('/allProduct', async (req, res) => {
            const search = req.query.search || '';
            const page = Number(req.query.page) || 0
            const limit = Number(req.query.limit) || 6
            console.log(search, page, limit);
            const query = {
                tags: { $regex: new RegExp(search, 'i') }
            }
            const cursor = allData.find(query);
            const totalItems = await cursor.count(); // Get the total count of matching items
            const result = await cursor.skip(page * limit).limit(limit).toArray();
            res.send({ totalItems, result });
        })
        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allData.findOne(query);
            res.send(result)
        })

        // review
        app.post('/addReview', async (req, res) => {
            const { reviewStar, message, displayName, email, _id } = req.body;
            // Check if a review with the same _id and email exists
            const query={email:email}
            const existingReview = await review.findOne(query);
            if (!existingReview) {
                const result = await review.insertOne({ reviewStar, message, displayName, email, _id });
                res.send(result)
            }
            else{
                res.send('You already add review on this product')
            }

        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`assignment 12 running on:${port}`)
})
