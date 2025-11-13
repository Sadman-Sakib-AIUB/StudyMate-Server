const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = 3000;

// Middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edhinet.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Server Running...");
});

async function run() {
  try {
    client.connect();
    const db = client.db("studyMate");
    const partnersCollection = db.collection("partners");
    const usersCollection = db.collection("users");
    const connectionsCollection = db.collection("connections");

    //------------------------------------- User APIs--------------------------------
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      const existingUser = await usersCollection.findOne({
        email: newUser.email,
      });
      if (!existingUser) {
        await usersCollection.insertOne(newUser);
      }
      res.send({ message: "User saved or already exists" });
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(404).send(null);
      }
      res.send(user);
    });

    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      const result = await usersCollection.updateOne(
        { email },
        { $set: updatedData }
      );
      res.send(result);
    });

    //------------------------------------ Partners APIs ---------------------------

    app.post("/partners", async (req, res) => {
      const newPartner = req.body;
      const result = await partnersCollection.insertOne(newPartner);
      res.send(result);
    });

    app.get("/partners", async (req, res) => {
      const cursor = partnersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/partners/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await partnersCollection.findOne(query);
      res.send(result);
    });

    app.patch("/partners/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { partnerCount } = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            partnerCount: partnerCount,
          },
        };

        const result = await partnersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating partner count:", error);
        res.status(500).send({ error: "Failed to update partner count" });
      }
    });

    //--------------------------------------- Connections APIs -------------------------------
    app.post("/connections", async (req, res) => {
      const connectionData = req.body;

      //prevent duplicate requests
      const exists = await connectionsCollection.findOne({
        partnerId: connectionData.partnerId,
        userEmail: connectionData.userEmail,
      });

      if (exists) {
        return res.status(400).send({ message: "Already connected!" });
      }
      const result = await connectionsCollection.insertOne(connectionData);
      res.send(result);
    });

    app.get("/connections", async (req, res) => {
      const email = req.query.email;
      const result = await connectionsCollection
        .find({ requesterEmail: email })
        .toArray();
      res.send(result);
    });

    app.delete("/connections/:id", async (req, res) => {
      const id = req.params.id;
      const result = await connectionsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.put("/connections/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await connectionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.get("/connections/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const result = await connectionsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching connections:", error);
        res.status(500).send({ error: "Failed to fetch user connections" });
      }
    });

    client.db("admin2").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server Running on port: ${port}`);
});
