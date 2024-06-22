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
        const user = client.db('assignment-12').collection('User')
        const Report = client.db('assignment-12').collection('Report')

        await client.connect();
        app.get('/', async (req, res) => {
            res.send('assignment-12 running....')
        })
        // allData only for feature and trandig section
        app.get('/data', async (req, res) => {

            const cursor = allData.find().sort({ date: -1 });
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/dsaboard/data', async (req, res) => {

            const sortOrder = {
                "Pending": 1,
                "Accepted": 2,
                "Rejected": 3 // Assuming other statuses like "Rejected"
            };

            // Add a custom field for sorting purposes
            const cursor = allData.aggregate([
                {
                    $addFields: {
                        sortOrder: { $cond: { if: { $eq: ["$status", "Pending"] }, then: 1, else: 2 } }
                    }
                },
                { $sort: { sortOrder: 1 } }, // Sort by the custom sortOrder field
                { $project: { sortOrder: 0 } } // Remove the custom sortOrder field from the result
            ]);

            const result = await cursor.toArray();
            res.send(result);
        })


        // data for all product with pagination
        app.get('/allProduct', async (req, res) => {
            const search = req.query.search || '';
            const page = Number(req.query.page) || 0
            const limit = Number(req.query.limit) || 6
            // console.log(search, page, limit);
            const query = {
                tags: { $regex: new RegExp(search, 'i') },
                status: { $ne: 'Pending' }
            }
            const cursor = allData.find(query);
            const totalItems = await cursor.count(); // Get the total count of matching items
            const result = await cursor.skip(page * limit).limit(limit).toArray();
            res.send({ totalItems, result });
        })
        // details page
        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allData.findOne(query);
            res.send(result)
        })
        // my product 
        app.get('/myProduct/:gmail', async (req, res) => {
            const gmail = req.params.gmail;
            // console.log(gmail)
            const query = { email: gmail };
            const result = await allData.find(query).toArray();
            res.send(result)
        })
        // review
        app.post('/addReview', async (req, res) => {
            const reviewData = req.body;
            try {
                const result = await review.insertOne(reviewData);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error adding review:', error);
                res.status(500).send({ message: 'An unexpected error occurred' });
            }
        });
        // update the data
        app.put('/updateProduct/:id', async (req, res) => {
            const id = req.params.id;
            const { image, name, tags, description, externalLinks } = req.body;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    image: image,
                    name: name,
                    tags: tags,
                    description: description,
                    externalLinks: externalLinks
                }
            }
            const result = await allData.updateOne(query, update);
            res.send(result)
        })
        // update  accept the product
        app.patch('/accpetProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }; // Corrected syntax error here
            const update = {
                $set: {
                    status: "Accepted"
                }
            };
            const result = await allData.updateOne(query, update)
            res.send(result)
        })
        // make feature
        app.patch('/feature/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }; // Corrected syntax error here
            const update = {
                $set: {
                    status: "feature"
                }
            };
            const result = await allData.updateOne(query, update)
            res.send(result)
        })
        // make admin
        app.patch('/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }; // Corrected syntax error here
            const update = {
                $set: {
                    role: "Admin"
                }
            };
            const result = await user.updateOne(query, update)
            res.send(result)
        })
        // make Moderator
        app.patch('/Moderator/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }; // Corrected syntax error here
            const update = {
                $set: {
                    role: "Moderator"
                }
            };
            const result = await user.updateOne(query, update)
            res.send(result)
        })
        app.post('/addMyProduct', async (req, res) => {
            const data = req.body;
            const result = await allData.insertOne(data);
            res.send(result);
        })
        // handle delete
        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await allData.deleteOne(query);
            res.send(result);
        })

        app.get('/reviewData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const reviews = await review.find(query).toArray();
            res.send(reviews);
        })

        // post user
        app.post('/addUser', async (req, res) => {
            const { email, displayName } = req.body;
            const data = req.body;
            const query = { email: email };
            const existingUser = await user.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User with this email already exists' });
            }
            const result = await user.insertOne(data);
            res.send(result)
        })

        // get user
        app.get('/getUser/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await user.findOne(query);
            res.send(result)
        })
        app.get('/getUser', async (req, res) => {
            const result = await user.find().toArray();
            res.send(result)
        })
        // report
        app.post('/report', async (req, res) => {
            const reviewData = req.body;
            const result = await Report.insertOne(reviewData);
            res.send(result);
        });
        // report data
        app.get('/reportData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const reviews = await Report.find(query).toArray();
            res.send(reviews);
        })
        app.get('/reportData', async (req, res) => {
            const reviews = await Report.find().toArray();
            res.send(reviews);
        })
        // deleter report product
        app.delete('/deleteReport/:id', async (req, res) => {
            const id = req.params.id;
            const _id = req.query._id
            const query = { _id: new ObjectId(id) }
            const query2 = { _id: new ObjectId(_id) }
            const result = await allData.deleteOne(query);
            const del = await Report.deleteOne(query2)
            res.send(result);
        })


        // get all data including pending
        // app.get('/getAllDataWithPending',async(req,res)=>{
        //     const 
        // })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`assignment 12 running on:${port}`)
})
