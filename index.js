const express = require("express");
const cors = require("cors");
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PAS}@cluster0.p45io4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 14,
});

async function run() {
    try {
        await client.connect();

        const allProduct = client.db("whiteAndBlack").collection("allProduct");

        // Get all products
        app.get('/collection/allProducts', async (req, res) => {
            try {
                const response = await allProduct.find().toArray();
                res.send(response);
            } catch (error) {
                console.error('Error fetching all products:', error);
                res.status(500).send({ error: 'An error occurred while fetching products' });
            }
        });

        // Get product by ID
        app.get('/product/:id', async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id)
                const searchId = { _id: id };
                console.log(searchId)
                const response = await allProduct.findOne(searchId);
                console.log(response)
                res.send(response);

            } catch (error) {
                console.error('Internal Server Error:', error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Add new products
        app.post('/collection/addProducts', async (req, res) => {
            try {
                const data = req.body;
                const response = await allProduct.insertOne(data);
                res.send(response);
            } catch (error) {
                console.error('Error adding product:', error);
                res.status(500).send({ error: 'An error occurred while adding the product' });
            }
        });

        // Get products by category
        app.get('/products/category', async (req, res) => {
            try {
                const category = req.query.category;
                const validCategories = ['tshirt', 'polos', 'shirt', 'jackets', 'headware', 'bottomware', 'deals', 'accessories', 'new', 'deal'];
                if (!validCategories.includes(category)) {
                    return res.status(400).send({ error: 'Invalid category' });
                }
                const query = { category: category };
                const response = await allProduct.find(query).toArray();
                res.send(response);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send({ error: 'An error occurred while fetching products' });
            }
        });

        // Root route
        app.get("/", (req, res) => {
            res.send("Welcome to the White And Black Server");
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // console.log("Successfully connected to MongoDB!");

    } finally {
        // Optional: Uncomment this to close the client after run completes, usually not needed in long-running applications
        // await client.close();
    }
}

run().catch(console.dir);
