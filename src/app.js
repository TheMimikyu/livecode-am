const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")

const app = express();
app.use(cors());
app.use(bodyParser.json());


const SECRET_KEY = "temp123";

// Store in memory
// Sample
let expenses = [
    { id:1, amount: 50, category: "Food", subCategory: "Groceries", date: "2024-03-25"},
    { id:2, amount: 100, category: "Food", subCategory: "Restaurants", date: "2024-03-26"},
    { id:3, amount: 1000, category: "Food", subCategory: "Online", date: "2024-03-27"},
];


//MiddleWare

function authenticateToken(res, res, next){
    const token = req.headers["authorization"];
    if(!token) return res.status(401).json({error: "Access denied: No Token"});

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, user) => {
        if(err) return res.status(403).json({error: "Invalid Token"})
    });
    req.user = user;
    next();
}

app.post("/login", (req,res) => {
    const {username} = req.body;
    if(!username) return res.status(400).json({error: "Username Required"});

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
})

// get by id
app.get("/expenses/:id", (req, res) => {
    const id = Number(req.params.id);
    const currExpense = expenses.find(tx => tx.id === id);
    
    if (!currExpense){
        return res.status(404).json({ error: "Transaction not found"});
    }

    res.json(currExpense);
});

//Add by id
app.post("/expenses/:id", (req, res) => {
    const id = Number(req.params.id);
    const {amount, category, subCategory, date} = req.body;
    let currExpense = expenses.find(tx=> tx.id=== id);
    if (currExpense){
        return res.status(409).json({ error: "Transaction of this ID already exists"});
    }

    const newTransaction = {id, amount, category, subCategory, date};
    expenses.push(newTransaction);

    res.status(201).json({message: "Transaction added", currExpense: newTransaction});
});


//update by id
app.put("/expenses/:id", (req, res) => {
    const id = Number(req.params.id);
    const {amount, category, subCategory, date} = req.body;
    let currExpense = expenses.find(tx=> tx.id=== id);
    if (!currExpense){
        return res.status(404).json({ error: "Transaction not found"});
    }

    if(amount) currExpense.amount = amount;
    if (category) currExpense.category = category;
    if(subCategory) currExpense.subCategory = subCategory;
    if(date) currExpense.date = date;

    res.json({message: "Transaction updated", currExpense});
});

// delete by id
app.delete("/expenses/:id", (req, res) => {
    const id = Number(req.params.id);
    const i = expenses.findIndex(tx => tx.id === id);
    
    if (i === -1){
        return res.status(404).json({ error: "Transaction not found"});
    }

    expenses.splice(i,1);
    res.json({message: "Transaction Deleted"});
});


//Get Expenses 
// Date, Category, or subCategory
app.get("/expenses", (req, res) => {
    const { start, end, category, subcategory } = req.query;

    let filtered = expenses;

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        filtered = filtered.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
        });
        return res.json({ expenses: filtered });
    }

    if (subcategory) {
        let subFiltered = filtered.filter(tx =>
            tx.subCategory.toLowerCase() === subcategory.toLowerCase()
        );
        let total = subFiltered.reduce((acc, tx) => acc + tx.amount, 0);

        return res.json({ expenses: subFiltered, total });
    }

    if (category) {
        let catFiltered = filtered.filter(tx =>
            tx.category.toLowerCase() === category.toLowerCase()
        );
        let total = filtered.reduce((acc, tx) => acc + tx.amount, 0);

        return res.json({ expenses: catFiltered, total });
    }

    res.json({ expenses });
});

// Run
const PORT = 5000;
app.listen(PORT, () => console.log(`Running at ${PORT}`));