const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { ObjectId } = mongoose.Types;
const Payload = require('./models/payload');

const url = 'mongodb+srv://searchData:search3126@searchbar-cluster.eo9vo.mongodb.net/?retryWrites=true&w=majority&appName=SearchBar-Cluster';

async function insertQuestions() {
  try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    const filePath = path.join(__dirname, 'questions.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawQuestions = JSON.parse(fileContent);

    const questions = rawQuestions.map((item) => {
      const transformedItem = { ...item };

      if (item._id && item._id.$oid) {
        transformedItem._id = new ObjectId(item._id.$oid);
      }

      if (item.siblingId && item.siblingId.$oid) {
        transformedItem.siblingId = new ObjectId(item.siblingId.$oid);
      }

      return transformedItem;
    });

    for (const question of questions) {
      try {
        // Use upsert to insert or update the document
        const result = await Payload.updateOne(
          { _id: question._id }, // Match by _id
          { $set: question },    // Update with the new data
          { upsert: true }       // Insert if not exists
        );
        console.log(`Processed question with _id: ${question._id}`, result);
      } catch (err) {
        console.error(`Error processing question with _id: ${question._id}`, err);
      }
    }

    console.log("Questions inserted/updated successfully!");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error inserting questions:", error);
  }
}

if (require.main === module) {
  insertQuestions();
}

module.exports = insertQuestions;
