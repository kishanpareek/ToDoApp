//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
_ = require("lodash");

mongoose.connect('mongodb://127.0.0.1/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }

});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todo list'
});

const item2 = new Item({
  name: 'Hit + to add an item'
});

const item3 = new Item({
  name: '<-- Hit this to delete an item'
});

const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);





const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', function(req, res){
  Item.find({})
  .then((foundItems) => {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Successfully added default items to the todo list.")
        })
        .catch(() =>{
          console.log(err)
      });
    }
    else
    res.render('list', {listTitle: "Today", newListItems: foundItems});
  })
  .catch((err) => {
    console.log(error);
  });
});






app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });
  if(listName === "Today"){
    newItem.save()
    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
    .then(foundList => {
      foundList.items.push(newItem)
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log(err);
    });

  }

});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  const itemId = req.body.checkbox;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem)
    .then((doc) => {
      console.log(`User ${doc.name} was removed from the database.`);
    })
    .catch((err) => {
      console.error(err);
    });
    res.redirect("/");
  }
  else{
    List.updateOne({ name: listName }, { $pull: { items: {_id: checkedItem}  } })
  .then(result => {
    console.log(`Item ${itemId} was removed from the list ${listName}.`);
    res.redirect("/" + listName);
  })
  .catch(error => {
    console.error(`Error removing item ${itemId} from list ${listName}: ${error}`);
  });
  }

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // Search for a list with the given name
  List.findOne({ name: customListName })
    .then(foundList => {
      if (foundList) {
        // If list exists, render it
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        // If list doesn't exist, create it and render it
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save()
          .then(() => res.redirect("/" + customListName))
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
});




app.get("/:", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});
const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
