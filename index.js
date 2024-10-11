const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PAS}@cluster0.p45io4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PAS}@cluster0.ddyy7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        //collections ====
        const products = client.db("White-black").collection("Products");
        const order = client.db("White-black").collection("Order");
        const posts = client.db("White-black").collection("Posts");
        const link = client.db("White-black").collection("Link");
        const contactUs = client.db("White-black").collection("ContactUs");
        const TopMovingText = client
            .db("White-black")
            .collection("TopMovingText");
        const BannerMovingText = client
            .db("White-black")
            .collection("BannerMovingText");
        const SecondBannerMovingText = client
            .db("White-black")
            .collection("SecondBannerMovingText");

        // Product related api start ==========================================
        // Get products
        app.get("/products/:category", async (req, res) => {
            try {
                const category = req.params.category;
                const minPrice = parseFloat(req.query.minPrice) || 0; // Default to 0 if not provided
                const maxPrice = parseFloat(req.query.maxPrice) || Infinity; // Default to Infinity if not provided

                // Base query with price range filtering for string-based prices
                let query = {
                    $expr: {
                        $and: [
                            { $gte: [{ $toDouble: "$price" }, minPrice] },
                            { $lte: [{ $toDouble: "$price" }, maxPrice] },
                        ],
                    },
                };

                // Add category filter if it's not "all"
                if (category === "deals") {
                    // Filter by deals: true
                    query.deals = true;
                } else if (category === "regular-fit") {
                    // Filter by fit: "regular-fit"
                    query.fit = "regular-fit";
                } else if (category === "slim-fit") {
                    // Filter by fit: "slim-fit"
                    query.fit = "slim-fit";
                } else if (category !== "all") {
                    // Filter by category (other than "all")
                    query.category = category;
                }

                // Fetch products based on the combined query
                const response = await products.find(query).toArray();
                res.send(response);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching products",
                });
            }
        });

        app.get("/products/:category/prices-and-stock", async (req, res) => {
            try {
                const category = req.params.category;

                // Base query with only category filtering
                let query = {};
                if (category !== "all") {
                    query.category = category;
                }

                // Fetch only the price and status fields for the filtered products
                const productsData = await products
                    .find(query, { projection: { price: 1, status: 1 } })
                    .toArray();

                // If no products are found, return default values
                if (productsData.length === 0) {
                    return res.send({
                        lowestPrice: 0,
                        highestPrice: 0,
                        inStockCount: 0,
                        outOfStockCount: 0,
                    });
                }

                // Convert string prices to numbers and extract stock status
                const numericPrices = productsData.map((product) =>
                    parseFloat(product.price)
                );
                const stockStatus = productsData.map(
                    (product) => product.status
                );

                // Get the lowest and highest prices
                const lowestPrice = Math.min(...numericPrices);
                const highestPrice = Math.max(...numericPrices);

                // Count how many products are in stock and out of stock
                const inStockCount = stockStatus.filter(
                    (status) => status === "in-stock"
                ).length;
                const outOfStockCount = stockStatus.filter(
                    (status) => status === "sold-out"
                ).length;

                // Send the result
                res.send({
                    lowestPrice,
                    highestPrice,
                    inStockCount,
                    outOfStockCount,
                });
            } catch (error) {
                console.error("Error fetching prices and stock:", error);
                res.status(500).send({
                    error: "An error occurred while fetching prices and stock",
                });
            }
        });

        //get mew lanced products
        app.get("/product/newlaunched", async (req, res) => {
            try {
                const response = await products
                    .find()
                    .sort({ timeStamp: -1 })
                    .limit(10)
                    .toArray();

                res.send(response);
            } catch (error) {
                console.error("Error fetching new launched products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching new launched products",
                });
            }
        });

        // Get product by ID
        app.get("/product/:id", async (req, res) => {
            try {
                const id = req.params.id;

                // Check if the id is valid ObjectId
                if (!ObjectId.isValid(id)) {
                    return res
                        .status(400)
                        .send({ error: "Invalid product ID" });
                }

                const searchId = { _id: new ObjectId(id) };

                // Fetch the product with the given ID
                const response = await products.findOne(searchId);

                // If no product found, return an empty object
                if (!response) {
                    return res.status(200).send({});
                }

                // Send the product if found
                res.status(200).send(response);
            } catch (error) {
                console.error("Internal Server Error:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.get("/product/home/accessories", async (req, res) => {
            try {
                const response = await products
                    .find({ category: "accessories" })
                    .sort({ timeStamp: -1 })
                    .limit(12)
                    .toArray();

                res.send(response);
            } catch (error) {
                console.error("Error fetching new launched products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching new launched products",
                });
            }
        });

        // Add product
        app.post("/product/addproducts", async (req, res) => {
            try {
                const data = req.body;
                const response = await products.insertOne(data);
                res.send(response);
            } catch (error) {
                console.error("Error adding product:", error);
                res.status(500).send({
                    error: "An error occurred while adding the product",
                });
            }
        });
        //update products -api
        app.put("/product/update/:id", async (req, res) => {
            const { id } = req.params; // Get the product ID from the URL
            const updatedData = req.body; // Get the updated data from the request body

            try {
                // Update the product using its ID
                const result = await products.updateOne(
                    { _id: new ObjectId(id) }, // Match the product by its ID
                    { $set: updatedData } // Set the updated fields
                );

                if (result.matchedCount === 0) {
                    // No product was found with that ID
                    res.status(404).send({ error: "Product not found" });
                } else {
                    // Product was successfully updated
                    res.send({
                        message: "Product updated successfully",
                        result,
                    });
                }
            } catch (error) {
                console.error("Error updating product:", error);
                res.status(500).send({
                    error: "An error occurred while updating the product",
                });
            }
        });

        // Product deletion api
        app.delete("/product/delete/:id", async (req, res) => {
            const { id } = req.params; // Get the ID from the request parameters

            try {
                // Ensure the ID is valid before querying the database
                const result = await products.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    // No product was found with that ID
                    res.status(404).send({ error: "Product not found" });
                } else {
                    // Product was successfully deleted
                    res.send({ message: "Product deleted successfully" });
                }
            } catch (error) {
                console.error("Error deleting product:", error);
                res.status(500).send({
                    error: "An error occurred while deleting the product",
                });
            }
        });

        // Get search products
        app.get("/products/search/:searchtext", async (req, res) => {
            try {
                const searchtext = req.params.searchtext;
                const query = {
                    title: {
                        $regex: searchtext,
                        $options: "i", // 'i' for case-insensitive search
                    },
                };
                const response = await products.find(query).toArray();
                res.send(response);
            } catch (error) {
                console.error("Error fetching all products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching products",
                });
            }
        });

        // Product related api end ==========================================

        // order related api start =====================================================

        // Place oder
        app.post("/api/confirmOrder", async (req, res) => {
            try {
                const data = req.body;

                const orderResponse = await order.insertOne(data);

                res.status(200).send({
                    message: "Order confirmed successfully",
                    orderResponse,
                });
            } catch (error) {
                console.error("Error confirming order:", error);
                res.status(500).send({
                    error: "An error occurred while confirming the order",
                });
            }
        });
        //Get all orders
        app.get("/order", async (req, res) => {
            try {
                const response = await order.find().toArray();
                res.send(response);
            } catch (error) {
                res.status(500).send({ error: "product cart data not found" });
            }
        });
        //single order api
        app.get("/order/:id", async (req, res) => {
            try {
                const id = req.params.id;

                // Check if the id is valid ObjectId
                if (!ObjectId.isValid(id)) {
                    return res
                        .status(400)
                        .send({ error: "Invalid product ID" });
                }

                const orderId = { _id: new ObjectId(id) };

                // Fetch the product with the given ID
                const response = await order.findOne(orderId);

                // If no product found, return an empty object
                if (!response) {
                    return res.status(200).send({});
                }

                // Send the product if found
                res.status(200).send(response);
            } catch (error) {
                console.error("Internal Server Error:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        // status update api response
        app.put("/order/status/:id", async (req, res) => {
            const orderId = req.params.id; // Get the order ID from the request params
            const { status } = req.body; // Get the new status from the request body

            try {
                // Assuming orderId is an ObjectId, convert it to ObjectId type
                const { ObjectId } = require("mongodb");

                // Find the order by ID and update its status
                const updateResult = await order.updateOne(
                    { _id: new ObjectId(orderId) }, // Find the order by ID
                    { $set: { status: status } } // Set the new status
                );

                // Check if the order was successfully updated
                if (updateResult.modifiedCount === 1) {
                    res.send({ message: "Order status updated successfully" });
                } else {
                    res.status(404).send({
                        error: "Order not found or no changes made",
                    });
                }
            } catch (error) {
                res.status(500).send({
                    error: "Failed to update order status",
                });
            }
        });

        // order related api end =====================================================

        // Moving text related api start =====================================================

        // top moving text ===========
        app.put("/top-moving-text/:id", async (req, res) => {
            try {
                const text = req.body.text;
                const updatedDoc = {
                    $set: {
                        text: text,
                    },
                };
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const option = { upsert: true };
                const response = await TopMovingText.updateOne(
                    query,
                    updatedDoc,
                    option
                );
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        app.get("/top-moving-text", async (req, res) => {
            try {
                const response = await TopMovingText.findOne();
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        // Banner moving text ===========
        app.put("/banner-moving-text/:id", async (req, res) => {
            try {
                const text = req.body.text;
                const updatedDoc = {
                    $set: {
                        text: text,
                    },
                };
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const option = { upsert: true };
                const response = await BannerMovingText.updateOne(
                    query,
                    updatedDoc,
                    option
                );
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        app.get("/banner-moving-text", async (req, res) => {
            try {
                const response = await BannerMovingText.findOne();
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });
        // Second banner moving text ===========
        app.put("/second-banner-moving-text/:id", async (req, res) => {
            try {
                const text = req.body.text;
                const updatedDoc = {
                    $set: {
                        text: text,
                    },
                };
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const option = { upsert: true };
                const response = await SecondBannerMovingText.updateOne(
                    query,
                    updatedDoc,
                    option
                );
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        app.get("/second-banner-moving-text", async (req, res) => {
            try {
                const response = await SecondBannerMovingText.findOne();
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        // Moving text related api end =====================================================

        // Post related api start =====================================================
        app.get("/post", async (req, res) => {
            try {
                const response = await posts.find().toArray();
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });
        app.get("/post/:id", async (req, res) => {
            const postId = req.params.id; // Get the updated data from the request body

            try {
                // Update the post based on the provided data
                const result = await posts.findOne({
                    _id: new ObjectId(postId),
                });

                // Check if the post was successfully updated
               res.send(result)
            } catch (error) {
                console.error("Error updating post", error);
                res.status(500).send({
                    error: "An error occurred while updating the post",
                });
            }
        });
        app.put("/post/:id", async (req, res) => {
            const postId = req.params.id; // Get the post ID from the request params
            const updatedData = req.body; // Get the updated data from the request body

            try {
                // Assuming postId is an ObjectId, convert it to ObjectId type
                const { ObjectId } = require("mongodb");

                // Update the post based on the provided data
                const updateResult = await posts.updateOne(
                    { _id: new ObjectId(postId) }, // Find the post by its ID
                    { $set: updatedData } // Set the new values from request body
                );

                // Check if the post was successfully updated
                if (updateResult.modifiedCount === 1) {
                    res.send({ message: "Post updated successfully" });
                } else {
                    res.status(404).send({
                        error: "Post not found or no changes made",
                    });
                }
            } catch (error) {
                console.error("Error updating post", error);
                res.status(500).send({
                    error: "An error occurred while updating the post",
                });
            }
        });

        //Post related api end =====================================================

        //highlight related api start =====================================================
        app.get("/highlight-product-link", async (req, res) => {
            try {
                const response = await link.findOne();
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        app.put("/highlight-product-link/:id", async (req, res) => {
            try {
                const linkData = req.body.link;
                const updatedDoc = {
                    $set: {
                        link: linkData,
                    },
                };
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const option = { upsert: true };
                const response = await link.updateOne(
                    query,
                    updatedDoc,
                    option
                );
                res.send(response);
            } catch (error) {
                console.error("Error fetching data", error);
                res.status(500).send({
                    error: "An error occurred while fetching data",
                });
            }
        });

        //highlight related api end =====================================================

        //Contact us related api start =====================================================

        app.get("/contact-us", async (req, res) => {
            try {
                const response = await contactUs.find().toArray();

                res.send(response);
            } catch (error) {
                console.error("Error fetching new launched products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching new launched products",
                });
            }
        });

        app.post("/contact-us", async (req, res) => {
            try {
                const data = req.body;
                const response = await contactUs.insertOne(data);
                res.send(response);
            } catch (error) {
                console.error("Error adding product:", error);
                res.status(500).send({
                    error: "An error occurred while adding the product",
                });
            }
        });

        app.delete("/contact-us/:id", async (req, res) => {
            const { id } = req.params; // Get the ID from the request parameters

            try {
                // Ensure the ID is valid before querying the database
                const result = await contactUs.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    // No document was found with that ID
                    res.status(404).send({ error: "Contact not found" });
                } else {
                    // Document was successfully deleted
                    res.send({ message: "Contact deleted successfully" });
                }
            } catch (error) {
                console.error("Error deleting contact:", error);
                res.status(500).send({
                    error: "An error occurred while deleting the contact",
                });
            }
        });

        //Contact us related api start =====================================================



        
        // Get products by category
        app.get("/products/category", async (req, res) => {
            try {
                const category = req.query.category;
                const validCategories = [
                    "tshirt",
                    "polos",
                    "shirt",
                    "jackets",
                    "headware",
                    "bottomware",
                    "deals",
                    "accessories",
                    "new",
                    "deal",
                ];
                if (!validCategories.includes(category)) {
                    return res.status(400).send({ error: "Invalid category" });
                }
                const query = { category: category };
                const response = await products.find(query).toArray();
                res.send(response);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching products",
                });
            }
        });
        // status to get
        app.get("/products/status", async (req, res) => {
            try {
                const status = req?.query?.category;
                const query = { status: status };
                const response = await products
                    .find(query)
                    .sort({ _id: -1 })
                    .limit(8)
                    .toArray();
                res.send(response);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).send({
                    error: "An error occurred while fetching products",
                });
            }
        });

        // admin all route
        // Add add too cart product
        app.post("/admin/product/add", async (req, res) => {
            try {
                const productData = req.body;

                const response = await products.insertOne(productData);

                res.send(response);
            } catch (error) {
                console.error("Error adding product add to card:", error);
                res.status(500).send({
                    error: "An error occurred while adding the product add to card",
                });
            }
        });
        // end admin all route
        // Add add too cart product

        // Add new products
        app.post("/collection/addProducts", async (req, res) => {
            try {
                const data = req.body;
                const response = await products.insertOne(data);
                res.send(response);
            } catch (error) {
                console.error("Error adding product:", error);
                res.status(500).send({
                    error: "An error occurred while adding the product",
                });
            }
        });

        // API route to get products by array of IDs
        app.post("/get-cart-products", async (req, res) => {
            try {
                // Get the array of product IDs from the request body
                const productIds = req.body.productIds;

                // Check if productIds is an array and contains valid ObjectId strings
                if (!Array.isArray(productIds) || productIds.length === 0) {
                    return res
                        .status(400)
                        .json({ error: "Product IDs array is required" });
                }

                // Convert the string IDs to ObjectId instances for MongoDB
                const objectIdArray = productIds.map((id) => new ObjectId(id));

                // Query the database to fetch products with the matching IDs
                const result = await products
                    .find({ _id: { $in: objectIdArray } })
                    .toArray();

                // Send the matching products as the response
                res.status(200).json(result);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).json({
                    error: "An error occurred while fetching products",
                });
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
