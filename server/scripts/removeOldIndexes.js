/* Run: node server/scripts/removeOldIndexes.js */
const mongoose = require("mongoose");

const MONGO = process.env.MONGO_URL || "mongodb://localhost:27017/test";

(async () => {
  try {
    await mongoose.connect(MONGO);
    const col = mongoose.connection.collection("testassignments");
    const indexes = await col.indexes();
    const old = indexes.find(i => i.name === "student_1_application_1_type_1_skill_1");
    if (old) {
      console.log("Dropping old unique index:", old.name);
      await col.dropIndex(old.name);
    } else {
      console.log("Old index not present.");
    }
  } catch (e) {
    console.error("Index drop failed:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
