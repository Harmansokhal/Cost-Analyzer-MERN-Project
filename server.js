import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import csv from "fast-csv";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/aws_cost");
const Billing = mongoose.model("Billing", new mongoose.Schema({
  date: Date, account: String, service: String, region: String,
  cost: Number, usage: Number
}));

// File upload
const upload = multer({ dest: "uploads/" });
app.post("/upload", upload.single("file"), (req, res) => {
  const rows = [];
  fs.createReadStream(req.file.path)
    .pipe(csv.parse({ headers: true }))
    .on("data", (r) => rows.push(r))
    .on("end", async () => {
      await Billing.insertMany(rows.map(r => ({
        date: new Date(r["UsageStartDate"]),
        account: r["LinkedAccountId"],
        service: r["ProductName"],
        region: r["AvailabilityZone"],
        cost: +r["UnblendedCost"] || 0,
        usage: +r["UsageQuantity"] || 0
      })));
      res.json({ status: "uploaded", rows: rows.length });
    });
});

// Get top 5 costly services
app.get("/summary", async (_, res) => {
  const data = await Billing.aggregate([
    { $group: { _id: "$service", cost: { $sum: "$cost" } } },
    { $sort: { cost: -1 } }, { $limit: 5 }
  ]);
  res.json(data);
});

app.listen(4000, () => console.log("Server running on port 4000"));
