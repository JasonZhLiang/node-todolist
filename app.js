//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSW}@cluster0.zg7lpaa.mongodb.net/todolist?retryWrites=true&w=majority`, { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {

  // Item.find({}, function (err, foundItems) {

  //   if (foundItems.length === 0) {
  //     Item.insertMany(defaultItems, function (err) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log("Successfully savevd default items to DB.");
  //       }
  //     });
  //     res.redirect("/");
  //   } else {
  //     res.render("list", { listTitle: "Today", newListItems: foundItems });
  //   }
  // });

  const foundItems = await Item.find({})
  if (foundItems.length === 0) {
    Item.insertMany(defaultItems)
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  }

});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // List.findOne({ name: customListName }, function (err, foundList) {
  //   if (!err) {
  //     if (!foundList) {
  //       //Create a new list
  //       const list = new List({
  //         name: customListName,
  //         items: defaultItems
  //       });
  //       list.save();
  //       res.redirect("/" + customListName);
  //     } else {
  //       //Show an existing list

  //       res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
  //     }
  //   }
  // });
  if (customListName == 'About') {
    // DO NOT use res.redirect("/about") here, it will get to this dead-loop, instead of go to get /about rout 
    res.render("about");
  } else {
    const foundList = await List.findOne({ name: customListName })
    if (!foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  }
});

app.post("/", async function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName })
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    const deleteresult = await Item.findByIdAndRemove(checkedItemId)
    console.log("Successfully deleted checked item.");
    res.redirect("/");

  } else {
    const updateresult = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
    res.redirect("/" + listName);
  }


});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
