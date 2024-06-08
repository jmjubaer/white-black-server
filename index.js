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
        const orderProduct = client.db("whiteAndBlack").collection("oderProducts");
        const customerAddress = client.db('whiteAndBlack').collection('customerAddress')

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

                const searchId = { _id: new ObjectId(id) };

                const response = await allProduct.findOne(searchId);

                res.send(response);

            } catch (error) {
                console.error('Internal Server Error:', error);
                res.status(500).send("Internal Server Error");
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
        // status to get 
        app.get('/products/status', async (req, res) => {
            try {
                const status = req?.query?.category;
                const query = { status: status };
                const response = await allProduct
                    .find(query)
                    .sort({ _id: -1 })
                    .limit(8)
                    .toArray();
                res.send(response);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send({ error: 'An error occurred while fetching products' });
            }
        });


        app.get('/oder/product', async (req, res) => {
            try {
                const response = await orderProduct.find().toArray();
                res.send(response);
            } catch (error) {
                res.status(500).send({ error: 'product cart data not found' });
            }
        });

        // admin all route 
        // Add add too cart product
        app.post('/admin/product/add', async (req, res) => {

            try {
                const productData = req.body;

                const response = await allProduct.insertOne(productData);

                res.send(response);
            } catch (error) {
                console.error('Error adding product add to card:', error);
                res.status(500).send({ error: 'An error occurred while adding the product add to card' });
            }

        })
        // end admin all route
        // Add add too cart product
        app.post('/product/add', async (req, res) => {

            try {
                const productData = req.body;

                const response = await orderProduct.insertOne(productData);

                res.send(response);
            } catch (error) {

                res.status(500).send({ error: 'An error occurred while adding the product add to card' });
            }


        })

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
        // confirm oder 
        app.post('/api/confirmOrder', async (req, res) => {

            try {
                const data = req.body;


                // Insert the order data into the customerAddress collection
                const orderResponse = await customerAddress.insertOne(data);

                // Ensure productId is an array and handle product deletions
                if (Array.isArray(data.productId)) {
                    let deleteCount = 0;
                    for (const element of data.productId) {


                        const deleteResponse = await orderProduct.deleteMany({ menuItemId: element });


                        if (deleteResponse.deletedCount > 0) {
                            deleteCount += deleteResponse.deletedCount;
                        }
                    }

                    res.send({
                        orderResponse,
                        message: `${deleteCount} products deleted`
                    });
                } else {
                    res.status(400).send({ error: 'Invalid productId format' });
                }
            } catch (error) {
                console.error('Error confirming order:', error);
                res.status(500).send({ error: 'An error occurred while confirming the order' });
            }
        });
        // Root route
        app.get("/", (req, res) => {
            res.send("Welcome to the White And Black Server");
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });



    } finally {

    }
}

run().catch(console.dir);
