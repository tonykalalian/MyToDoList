const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const app = express();

const _ = require("lodash");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//Set up mongodb connection using mongoose to our todolistDB Database
mongoose.connect(
  "mongodb+srv://tkalalian:root@cluster0.r2zawkr.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);
//Creating itemSchema
const itemsSchema = {
  name: String,
};
//Creating item model ===== collection : items
const Item = mongoose.model("Item", itemsSchema);
// Addid three elements to the items collection
const item1 = new Item({
  name: "Welcome to your todolist",
});
const item2 = new Item({
  name: "Hit the plus button to add a new item",
});
const item3 = new Item({
  name: "Press here to delete an item",
});
//Default items: Three default to-do items (item1, item2, and item3) are created based on the Item model. These items are used to populate the initial to-do list.
const defaultItems = [item1, item2, item3];
//Creating listSchema
const listSchema = {
  name: String,
  items: [itemsSchema],
};
//Creating list model === collection:lists
const List = mongoose.model("List", listSchema);
//Default route ("/"): When a GET request is made to the root URL ("/"), the code finds all items in the Item collection using Item.find({}). If no items are found, the default items are inserted into the Item collection using Item.insertMany(). If items are found, the "list" view is rendered with the found items.
app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

//Custom list route ("/:customListName"): When a GET request is made to a URL with a custom list name, the code creates a new list based on the List model with the custom list name and the default items. If the list is found in the database, the "list" view is rendered with the list's title and items.
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        return list.save().then(() => {
          res.redirect("/" + customListName);
        });
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      // Handle any errors
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

//Create item route ("/"): When a POST request is made to the root URL ("/"), a new item is created based on the provided name in the request body. If the list name is "Today", the item is saved to the Item collection. If the list name is a custom list, the item is added to the corresponding list in the List collection.
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item
      .save()
      .then(() => res.redirect("/"))
      .catch((err) => {
        // Handle error
        console.error(err);
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => res.redirect("/" + listName))
      .catch((err) => {
        // Handle error
        console.error(err);
      });
  }
});

//Delete item route ("/delete"): When a POST request is made to the "/delete" URL, an item is deleted based on the provided ID in the request body. The item is removed from the Item collection using Item.findByIdAndRemove().
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .exec()
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch((err) => {
        // Handle error
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .exec()
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        // Handle error
      });
  }
});

//Additional routes: The code includes additional routes for specific lists ("/work") and an "about" page ("/about"), which render the respective views.
app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
