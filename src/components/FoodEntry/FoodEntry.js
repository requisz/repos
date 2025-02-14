import React, { useState } from "react";
import axios from "axios";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import RequireAuth from "../RequireAuth";
import { auth } from "../../firebase";
import { db } from "../../firebase";
import { addDoc, collection } from "firebase/firestore";

function FoodEntry() {
  // State hooks for form inputs
  const [foodName, setFoodName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [calories, setCalories] = useState("");

  // State hooks for food search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Handle adding food entry to Firestore
  const handleAddFood = async (event) => {
    event.preventDefault();
    
    if (!auth.currentUser) {
      alert("No user is signed in.");
      return;
    }

    const today = new Date().toISOString().split("T")[0]; 
    const userDiaryPath = `userFoodDiaries/${auth.currentUser.uid}/entries`;
    const dateEntryPath = `${today}/diaryEntries`;
    try {
      await addDoc(collection(db, userDiaryPath, dateEntryPath), {
        foodName,
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        calories: parseInt(calories, 10), 
        date: today,
      });
      alert("Food entry added successfully!");
      
      // Clear form fields after submission
      setFoodName("");
      setProtein("");
      setCarbs("");
      setFats("");
      setCalories("");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error adding food entry. Check the console for details.");
    }
  };

  // Search for food items using external API
  const searchFoods = async (query) => {
    try {
      const response = await axios.get(
        "https://api.nal.usda.gov/fdc/v1/foods/search", {
          params: {
            api_key: "AnK9gFBNAvSmM8HyaCn5JT6atGFLXdAJjwp8zaQh",
            query: query,
          },
        }
      );
      console.log(response.data.foods[0].foodNutrients); 
      setSearchResults(response.data.foods);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await searchFoods(searchTerm);
  };

  // Find specific nutrient in food item
  const findNutrient = (nutrients, nutrientName) => {
    const nutrient = nutrients.find((n) => n.nutrientName === nutrientName);
    return nutrient ? nutrient.value : "N/A";
  };

  // Render search results
  const renderSearchResults = () => {
    return searchResults.map((food, index) => (
      <div key={index}>
        <h3>{food.description}</h3>
        <p>Protein: {findNutrient(food.foodNutrients, "Protein")} g</p>
        <p>Fats: {findNutrient(food.foodNutrients, "Total lipid (fat)")} g</p>
        <p>Carbs: {findNutrient(food.foodNutrients, "Carbohydrate, by difference")} g</p>
        <p>Calories: {findNutrient(food.foodNutrients, "Energy")} kcal</p>
      </div>
    ));
  };

  return (
    <div>
      <h1>Food Entry</h1>
      <Header />
      <div>
        <h2>Add Your Food</h2>
        <form onSubmit={handleAddFood}>
          {/* Input fields for food entry */}
          <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Food Name" required />
          <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein (g)" required />
          <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs (g)" required />
          <input type="number" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="Fats (g)" required />
          <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" required/>

          <button className="button" type="submit">Add Food</button>
        </form>
      </div>

      <div>
        <h2>Food Macronutrients Search</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            required
          />
          <button className="button" type="submit">Search</button>
        </form>
        <div>{renderSearchResults()}</div>
      </div>
      <Footer />
    </div>
  );
}

export default RequireAuth(FoodEntry);
