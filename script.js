//Javascript functions
document.addEventListener("DOMContentLoaded", () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || []; // Load cart from localStorage

  // Function to update cart display on the menu page
  function updateCartDisplay() {
    const cartContainer = document.getElementById("cart-items");
    const totalContainer = document.getElementById("cart-total");
    cartContainer.innerHTML = ""; // Clear cart display
    let total = 0;

    cart.forEach((item, index) => {
      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");
      cartItem.innerHTML = `
        <p>${item.name} (€${item.price})</p>
        <button class="remove-from-cart" data-index="${index}">Remove</button>
      `;
      cartContainer.appendChild(cartItem);
      total += parseFloat(item.price);
    });

    totalContainer.textContent = `Total: €${total.toFixed(2)}`;
    localStorage.setItem("cart", JSON.stringify(cart)); // Save cart to localStorage
  }

  // Add to Cart functionality
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (e) => {
      const menuItem = e.target.closest(".menu-item");
      const name = menuItem.getAttribute("data-name");
      const price = menuItem.getAttribute("data-price");

      if (name && price) {
        cart.push({ name, price });
        updateCartDisplay();
        displayMessage(`${name} added to cart!`, false);
      } else {
        console.error("Data attributes are missing on the menu item.");
      }
    });
  });

  // Remove from Cart functionality
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-from-cart")) {
      const index = e.target.getAttribute("data-index");
      cart.splice(index, 1); // Remove item from cart
      updateCartDisplay();
    }
  });

  // Proceed to Checkout
  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      const total = cart.reduce(
        (sum, item) => sum + parseFloat(item.price),
        0
      ).toFixed(2);
      if (total > 0) {
        localStorage.setItem("cart", JSON.stringify(cart)); // Save cart to localStorage
        window.location.href = `checkout.html`;
      } else {
        displayMessage("Your cart is empty!", true);
      }
    });
  }
});

// Initialize Firebase
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTEhmdxRi3jfS04JKabc8GyxTidpLtnxY",
  authDomain: "websitemocha.firebaseapp.com",
  projectId: "websitemocha",
  storageBucket: "websitemocha.appspot.com",
  messagingSenderId: "746223848804",
  appId: "1:746223848804:web:0e9db94c26d8204d0fbe71",
  measurementId: "G-ZJ3DNS4V52",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage(); // Initialize storage
const db = firebase.firestore();

// DOM Elements
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutButton = document.getElementById("logout-button");
const authSection = document.getElementById("auth-section");
const profileSection = document.getElementById("profile-section");
const userEmailSpan = document.getElementById("user-email-display");
const userEmailDisplay = document.getElementById("user-email-display");
const messageContainer = document.getElementById("message-container"); // For displaying dynamic messages
const uploadProfilePictureButton = document.getElementById("upload-profile-picture");
const profilePictureUpload = document.getElementById("profile-picture-upload");
const profilePicture = document.getElementById("profile-picture");

// Helper function to display messages
function displayMessage(message, isError = false) {
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.style.color = isError ? "red" : "green";
    messageContainer.style.display = "block";
    setTimeout(() => {
      messageContainer.style.display = "none";
    }, 3000);
  } else {
    alert(message);
  }
}

// Check Authentication State
auth.onAuthStateChanged((user) => {
  if (user) {
    authSection.style.display = "none";
    profileSection.style.display = "block";
    userEmailSpan.textContent = user.email;
    userEmailDisplay.textContent = user.email;

    db.collection("users").doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          console.log("User Data:", userData);

          // Display the user's name
          const userNameDisplay = document.getElementById("user-name-display");
          if (userNameDisplay) {
            userNameDisplay.textContent = userData.name || "User";
          }
        } else {
          console.log("No such document!");
        }
      })
      .catch((error) => {
        console.error("Error getting user data:", error);
      });
  } else {
    authSection.style.display = "block";
    profileSection.style.display = "none";
  }
});

// Sign Up
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return db.collection("users").doc(user.uid).set({
        email: user.email,
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      displayMessage("Account created successfully!", false);
      signupForm.reset();

      // Redirect to profile after signup
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1000);
    })
    .catch((error) => {
      displayMessage(`Error: ${error.message}`, true);
    });
});


// Login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      displayMessage("Login successful!", false);

      loginForm.reset();

      // Redirect after login
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1000);
    })
    .catch((error) => {
      displayMessage(`Error: ${error.message}`, true);
    });
});


// Logout
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        displayMessage("Logged out successfully!", false);
      })
      .catch((error) => {
        displayMessage(`Error: ${error.message}`, true);
      });
  });
}

const editProfileForm = document.getElementById("edit-profile-form");
const editProfileMessage = document.getElementById("edit-profile-message");

if (editProfileForm) {
  editProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = document.getElementById("edit-name").value;
    const newEmail = document.getElementById("edit-email").value;

    const user = auth.currentUser;

    if (!user) {
      editProfileMessage.textContent = "No user is signed in.";
      return;
    }

    // Update Firestore user name
    const userDocRef = db.collection("users").doc(user.uid);

    userDocRef.update({
      name: newName
    }).then(() => {
      console.log("Name updated in Firestore.");
      document.getElementById("user-name-display").textContent = newName;
      editProfileMessage.textContent = "Name updated successfully!";
    }).catch((error) => {
      console.error("Error updating name:", error);
      editProfileMessage.textContent = `Error updating name: ${error.message}`;
    });

    // Update email in Firebase Auth
    user.updateEmail(newEmail)
      .then(() => {
        console.log("Email updated in Firebase Auth.");
        document.getElementById("user-email-display").textContent = newEmail;
        editProfileMessage.textContent += " Email updated successfully!";
      })
      .catch((error) => {
        console.error("Error updating email:", error);
        editProfileMessage.textContent += ` Error updating email: ${error.message}`;
      });

    editProfileForm.reset();
  });
}

// Elements for toggle
const loginContainer = document.getElementById("login-container");
const signupContainer = document.getElementById("signup-container");
const showSignupLink = document.getElementById("show-signup");
const showLoginLink = document.getElementById("show-login");

if (showSignupLink) {
  showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Animate transition
    loginContainer.classList.add("fade-out");
    
    setTimeout(() => {
      loginContainer.style.display = "none";
      signupContainer.style.display = "block";
      signupContainer.classList.add("fade-in");

      // Reset classes for smooth repeatable transitions
      loginContainer.classList.remove("fade-out");
      signupContainer.classList.remove("fade-in");
    }, 500);
  });
}

if (showLoginLink) {
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();

    signupContainer.classList.add("fade-out");

    setTimeout(() => {
      signupContainer.style.display = "none";
      loginContainer.style.display = "block";
      loginContainer.classList.add("fade-in");

      signupContainer.classList.remove("fade-out");
      loginContainer.classList.remove("fade-in");
    }, 500);
  });
}


