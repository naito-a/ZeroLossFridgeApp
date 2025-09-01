// db.js
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function getAllItems(tableName) {
  const params = { TableName: tableName };
  try {
    const data = await dynamo.scan(params).promise();
    return data.Items;
  } catch (err) {
    console.error("❌ DynamoDB error:", err);
    throw err;
  }
}
