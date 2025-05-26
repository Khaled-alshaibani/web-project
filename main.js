// * الفائدة منى DOMContentLoaded هو انها عند ضغط زر او ارسال فورم تنتظر جميع العناصر لتحمل ثم ترسلها الى الدالة او الصفحة المراد ارسال البيانات اليها.

// * User class and related functions.
class User {
  constructor(id, username, password, token = null, expiry = null) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.token = token; // توكن المستخدم (string أو null)
    this.expiry = expiry; // تاريخ انتهاء صلاحية التوكن (string أو null)
    this.posts = this.getUserPosts();
  }

  // * Getting user's posts
  getUserPosts() {
    let articlesString = localStorage.getItem("articles");
    if (!articlesString) return [];
    try {
      let articles = JSON.parse(articlesString);
      return articles.filter((article) => article.author === this.username);
    } catch {
      return [];
    }
  }

  // * Check the validity of the token.
  isTokenValid() {
    if (!this.token || !this.expiry) return false;
    const now = new Date();
    const expiryDate = new Date(this.expiry);
    return now < expiryDate;
  }
}

// * Sign Up
function signUp(username, password) {
  let usersString = localStorage.getItem("users");
  let users = [];

  if (usersString) {
    try {
      users = JSON.parse(usersString);
    } catch {
      users = [];
      localStorage.removeItem("users");
    }
  }

  if (users.some((u) => u.username === username)) {
    alert("Username already exists");
    return null;
  }

  const id = users.length > 0 ? users[users.length - 1].id + 1 : 1;
  const newUser = new User(id, username, password);

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  alert("User signed up successfully");
  return newUser;
}

// * Login
function login(username, password) {
  let usersString = localStorage.getItem("users");
  if (!usersString) return null;

  let users = JSON.parse(usersString);

  let rawUser = users.find((u) => u.username === username);

  if (rawUser && rawUser.password === password) {
    // ? هذا السطر يحسب التوكن، وهي قيمة تسمح للمتغير بالدخول للموقع مباشرة طول ما الحساب لديه توكن بدون طلب التسجيل كل مرة، حاليا خلينا التوكن لمدة شهر، بعد شهر لازم يسجل الدخول مرة ثاني
    const token = Math.random().toString(36).substr(2);
    const expiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // ? Raw تعني انه مش من نوع كلاس، لذلك اولا استقبلنا قيمته وبعدين بنخليه من نوع كلاس تحت
    rawUser.token = token;
    rawUser.expiry = expiry;

    const updatedUsers = users.map((u) =>
      u.username === username ? rawUser : u
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", username);

    // ? هنا خليناه من نوع كلاس
    const user = new User(
      rawUser.id,
      rawUser.username,
      rawUser.password,
      token,
      expiry
    );

    // ? إظهار الاسم والرابط
    let login = document.querySelector(".login");
    let signUp = document.querySelector(".Sign_up");

    if (login) {
      login.innerHTML = `<a href="#" onclick="setTargetUser(${"localStorage.getItem('currentUser')"})">${
        user.username
      }</a>`;
    }

    if (signUp) {
      signUp.innerHTML = `<a href="./index.html" id="logout">Log out</a>`;

      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "logout") {
          e.preventDefault();
          logoutUser(user.username);
        }
      });
    }

    return user;
  } else {
    return null;
  }
}

// * this function is checking the validity of the token.

function checkUserTokenValidity(username) {
  let usersString = localStorage.getItem("users");
  if (!usersString) return false;

  try {
    let users = JSON.parse(usersString);
    let user = users.find((u) => u.username === username);
    if (!user) return false;

    if (!user.token || !user.expiry) return false;

    const now = new Date();
    const expiryDate = new Date(user.expiry);
    return now < expiryDate;
  } catch {
    return false;
  }
}

// * This window event is checking who is the current user, and display it, also it load the event of signing up, and log in.
document.addEventListener("DOMContentLoaded", () => {
  checkAndDisplayLoggedInUser();

  let signInBtn = document.querySelector("#Sign_up_btn");
  if (signInBtn) {
    signInBtn.addEventListener("click", (event) => {
      event.preventDefault();
      let userName = document.querySelector("#SignUp_username").value;
      let password = document.querySelector("#SignUp_password").value;

      usernameIsNull = signUp(userName, password);

      if (usernameIsNull != null) {
        window.location.href = "./redirect.html";
      }
    });
  }

  let loginBtn = document.querySelector("#Login_btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      let userName = document.querySelector("#Login_username").value;
      let password = document.querySelector("#Login_password").value;

      const user = login(userName, password);

      if (user) {
        window.location.href = "./index.html";
      } else {
        alert("Login failed, user or password are not correct");
      }
    });
  }
});

// * checks the current logged in user.
function checkAndDisplayLoggedInUser() {
  let usersString = localStorage.getItem("users");
  if (!usersString) return;

  try {
    let users = JSON.parse(usersString);
    const now = new Date();

    let validUser = users.find((u) => {
      if (!u.token || !u.expiry) return false;
      return now < new Date(u.expiry);
    });

    if (validUser) {
      let login = document.querySelector(".login");
      let signUp = document.querySelector(".Sign_up");

      if (login) {
        login.innerHTML = `<a href="#" onclick="setTargetUser(${"localStorage.getItem('currentUser')"})">${
          validUser.username
        }</a>`;
      }

      if (signUp) {
        signUp.innerHTML = `<a href="./index.html" id="logout_link">Log out</a>`;
      }

      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "logout_link") {
          e.preventDefault();
          logoutUser(validUser.username);
        }
      });
    }
  } catch (e) {
    console.error("Error validating token:", e);
  }
}

// * log out function.
function logoutUser(username) {
  let usersString = localStorage.getItem("users");
  if (!usersString) return;

  confirmed = confirm("Are you sure you want to log out?");

  if (confirmed) {
    try {
      let users = JSON.parse(usersString);
      let userIndex = users.findIndex((u) => u.username === username);
      if (userIndex !== -1) {
        users[userIndex].token = null;
        users[userIndex].expiry = null;
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.removeItem("currentUser");
      }

      let login = document.querySelector(".login");
      let signUp = document.querySelector(".Sign_up");

      if (login) {
        login.innerHTML = `<a href="./Login.html">Login</a>`;
      }

      if (signUp) {
        signUp.innerHTML = `<a href="./Sign_up.html">Sign Up</a>`;
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  } else {
    return;
  }
}

// ! Here starts articles functions
// * Article class and related functions.
class Article {
  constructor(id, header, author, time_created, img, content) {
    this.id = id;
    this.header = header;
    this.author = author;
    this.time_created = time_created;
    this.img = img;
    this.content = content;
  }
}

// * Adding articles to the local storage.
function addArticle(header, img, content) {
  let articles = [];

  try {
    articles = JSON.parse(localStorage.getItem("articles")) || [];
  } catch {
    articles = [];
    localStorage.removeItem("articles");
  }

  const id = articles.length > 0 ? articles[articles.length - 1].id + 1 : 1;
  const author = localStorage.getItem("currentUser") || "Unknown";
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const time_created = now.toLocaleDateString("en-US", options);

  const article = {
    id,
    header,
    author,
    time_created,
    img: img || null,
    content,
  };

  articles.push(article);
  localStorage.setItem("articles", JSON.stringify(articles));
  window.location.href = "./profile.html";
}

// * updateing articles and store them in local storage again.
function editArticle(id, newData) {
  console.log("accessed");

  let articles = JSON.parse(localStorage.getItem("articles") || "[]");

  let index = articles.findIndex((article) => article.id === id);
  if (index === -1) return false;

  if (newData.header !== undefined) {
    articles[index].header = newData.header;
  }

  if (newData.img !== undefined) {
    articles[index].img = newData.img;
  }

  if (newData.content !== undefined) {
    articles[index].content = newData.content;
  }

  window.location.href = "./profile.html";
  localStorage.setItem("articles", JSON.stringify(articles));
  return true;
}

// * deleting article from local storage.
function deleteArticle(id) {
  console.log(id);

  let isConfrimed = confirm("Do you want to delete Post?");
  if (isConfrimed) {
    let articles = JSON.parse(localStorage.getItem("articles") || "[]");

    let filtered = articles.filter((article) => article.id !== id);
    localStorage.setItem("articles", JSON.stringify(filtered));
    window.location.href = "./profile.html";
  } else {
    return;
  }
}

// * showing recent added articles in the home page.
function showRecentArticles() {
  let articlesString = localStorage.getItem("articles");
  let articles = [];

  if (articlesString) {
    try {
      articles = JSON.parse(articlesString);
    } catch {
      articles = [];
      localStorage.removeItem("articles");
    }
  }

  // فرز المقالات حسب time_created (من الأحدث للأقدم)
  articles.sort((a, b) => new Date(b.time_created) - new Date(a.time_created));

  for (let index = 0; index < Math.min(5, articles.length); index++) {
    let header = articles[index].header;
    let author = articles[index].author;
    let time = articles[index].time_created;

    let article = `
      <div class="article">
        <h2>
          <a href="#" onclick="setTargetArticle('${header}')">${header}</a>
        </h2>
        <hr>
        <h4><a href="#" onclick="setTargetUser('${author}')">${author}</a></h4>
        <h5>${time}</h5>
      </div>
    `;

    let recentArticles = document.querySelector(".articles");
    recentArticles.innerHTML += article;
  }
}

// * showing the selected article to get the whole article info.
function showArticle() {
  let header = localStorage.getItem("targetArticle");
  if (!header) return;

  let articleString = localStorage.getItem("articles");
  if (!articleString) return;

  try {
    let articles = JSON.parse(articleString);
    let article = articles.find((a) => a.header === header);
    if (!article) return;

    let selected_article = `
      <h1>${article.header}</h1>
      <p><strong>Author:</strong> ${article.author}</p>
      <p><strong>Time Created:</strong> ${article.time_created}</p>
      <div class="article_img">
        <img src="${article.img}" alt="photo" />
      </div>
      <p>${article.content}</p>

    `;

    let articlePage = document.querySelector(".article_page");
    if (articlePage) {
      articlePage.innerHTML = selected_article;
    }
  } catch (e) {
    console.error("Error showing article:", e);
  }
}

// * this window event is redirecting the explorer to the loaded page
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("index.html") || path.endsWith("/")) {
    showRecentArticles();
  } else if (path.includes("article.html")) {
    showArticle();
    if (path.includes("profile.html")) {
      showUserProfile();
    }
  }
});

// * getting all users of the blog.
function ShowAllUsers() {
  let usersString = localStorage.getItem("users");
  if (!usersString) return;

  try {
    let usersRaw = JSON.parse(usersString);
    if (usersRaw.length === 0) return;

    const allUsers = document.querySelector(".users");
    if (!allUsers) return;

    allUsers.innerHTML = "";

    usersRaw.forEach((u) => {
      const user = new User(u.id, u.username, u.password, u.token, u.expiry);
      let content = `
        <div class="user">
          <strong><h2><a href="#" onclick="setTargetUser('${user.username}')">${user.username}</a></h2><hr></strong>
          <strong><p>Number of Posts: ${user.posts.length}</p></strong>
        </div>
      `;
      allUsers.innerHTML += content;
    });
  } catch (e) {
    console.error("Error parsing users:", e);
  }
}

// * getting all posts in the blog, i might do pagination, but the current posts of blog don't need any of that.
function ShowAllPosts() {
  let articlesString = localStorage.getItem("articles");
  let articles = [];

  if (articlesString) {
    try {
      articles = JSON.parse(articlesString);
    } catch {
      articles = [];
      localStorage.removeItem("articles");
    }
  }

  const posts = document.querySelector(".posts");
  if (!posts) return;

  posts.innerHTML = "";

  articles.sort((a, b) => new Date(b.time_created) - new Date(a.time_created));
  for (let index = 0; index < articles.length; index++) {
    let article = `
      <div class="article">
        <h2>
          <a href="#" onclick="setTargetArticle('${articles[index].header}')">
            ${articles[index].header}
          </a>
        </h2>
        <hr>
        <h4><a href="#" onclick="setTargetUser('${articles[index].author}')">${articles[index].author}</a></h4>
        <h5>${articles[index].time_created}</h5>
      </div>
    `;
    posts.innerHTML += article;
  }
}

// * This window event is for showing the profile of a specific user, either that user was you or any other user.
window.addEventListener("DOMContentLoaded", function () {
  function showUserProfile() {
    const currentUser = localStorage.getItem("currentUser");
    let targetUser = localStorage.getItem("targetUser");

    if (!targetUser && currentUser) {
      targetUser = currentUser;
      localStorage.setItem("targetUser", targetUser);
    }

    if (!targetUser) {
      window.location.href = "./login.html";
      return;
    }
    const isOwner = currentUser === targetUser;
    let username = targetUser;

    let articlesString = localStorage.getItem("articles");
    let articles = [];
    if (articlesString) {
      try {
        articles = JSON.parse(articlesString);
      } catch {
        articles = [];
      }
    }

    const userPosts = articles.filter((article) => article.author === username);

    let content = `<h2 style="margin-right: auto;">${username}</h2>`;

    if (isOwner) {
      content += `<button style="margin-right: auto;" class="addArticle">Add article</button>`;
    }

    content += `</h2><hr><p style="margin-right: auto;">Posts:</p>`;

    if (userPosts.length === 0) {
      content += `<p>No posts found.</p>`;
    } else {
      userPosts.sort(
        (a, b) => new Date(b.time_created) - new Date(a.time_created)
      );
      userPosts.forEach((post) => {
        content += `
        <div class="article">
          <h3><a href="#" onclick="setTargetArticle('${post.header}')">${
          post.header
        }</a></h3><hr>
          <p><strong>Date:</strong> ${post.time_created}</p>
          <p>${post.content.substring(
            0,
            100
          )}... <a href="#" onclick="setTargetArticle('${
          post.header
        }')"><b>read more</b></a></p>`;

        if (isOwner) {
          content += `
          <button class="edit" onclick="showUpdateArticlePage(${post.id})">Edit</button>
          <button class="delete" onclick="deleteArticle(${post.id})">Delete</button>`;
        }

        content += `</div><hr>`;
      });
    }

    const profileContainer = document.querySelector(".Profile");
    if (profileContainer) {
      profileContainer.innerHTML = content;
    }
  }
  showUserProfile();

  const addArticleBtn = document.querySelector(".addArticle");
  if (addArticleBtn) {
    addArticleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("clicked");
      window.location.href = "./addArticle.html";
    });
  }
});

// * this window event is checking the selected users to print thier info, and redirecting you to the setTargetUser function, its work only when you click on the profile anchor to show the logged in user(YOU).
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".profile").addEventListener("click", (e) => {
    e.preventDefault();

    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.removeItem("targetUser");
      localStorage.setItem("targetUser", currentUser);
      setTargetUser(currentUser);
      window.location.href = "./profile.html";
    } else {
      console.error("No user logged in");
      window.location.href = "./login.html";
    }
  });
});

// * this is setting the value of selected article to view its whole info and storing it in the local storage.
function setTargetArticle(header) {
  localStorage.setItem("targetArticle", header);
  window.location.href = "./article.html";
}

// * this is setting the value of selected user to view its whole info, and articls and storing it in the local storage.
function setTargetUser(username) {
  console.log(username);

  localStorage.setItem("targetUser", username);
  window.location.href = "./profile.html";
}

// * this window event is loading the button of adding and redircting you to addArticle.html.
document.addEventListener("DOMContentLoaded", function () {
  const addBtn = document.querySelector(".addArticle");
  if (!addBtn) return;
  document.querySelector(".addArticle").addEventListener("click", function (e) {
    e.preventDefault();

    console.log("clicked");
    window.location.href = "./addArticle.html";
  });
});

// * this window event is loading the form that the users made and sends elements to the addArticle Fucntion.
window.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".articleForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const header = document.getElementById("header").value;
    const img = document.getElementById("img").value;
    const content = document.getElementById("content").value;
    console.log();

    addArticle(header, img, content);
  });
});

// * this function is showing the html page of updating.
function showUpdateArticlePage(id) {
  console.log("accessed");

  localStorage.setItem("editedID", id);
  window.location.href = "./updateArticle.html";
}

// * this window event is showing the form to update an article, and sending elements to editArticle function.
window.addEventListener("DOMContentLoaded", () => {
  let id = Number(localStorage.getItem("editedID"));
  const articles = JSON.parse(localStorage.getItem("articles") || "[]");
  const article = articles.find((a) => a.id === id);
  if (!article) return;

  const updatedArticle = document.querySelector(".updatedForm");
  if (!updatedArticle) return;

  let content = `
    <form class="articleForm">
      <div>Update Article</div>
      <input type="text" id="header" placeholder="Header" required value="${
        article.header
      }" />
      <input type="url" id="img" placeholder="Image URL" value="${
        article.img || ""
      }" />
      <p>Or upload it from your device:</p>
      <input type="file" id="imgFile" />
      <textarea id="content" placeholder="Content" required>${
        article.content
      }</textarea>
      <button type="submit">Update Article</button>
    </form>
  `;
  updatedArticle.innerHTML = content;

  const form = document.querySelector(".articleForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const header = document.getElementById("header").value;
    const imgUrl = document.getElementById("img").value;
    const imgFile = document.getElementById("imgFile").files[0];
    const content = document.getElementById("content").value;

    const newData = { header, img: imgUrl || null, content };

    if (imgFile) {
      const reader = new FileReader();
      reader.onload = function () {
        newData.img = reader.result;
        editArticle(id, newData);
        window.location.href = "./profile.html";
      };
      reader.readAsDataURL(imgFile);
    } else {
      editArticle(id, newData);
      window.location.href = "./profile.html";
    }
  });
});

// * this is calling of function that don't need to load elements using DOMContentLoaded.
ShowAllPosts();
ShowAllUsers();

// ? the following lines are useless, they are the functions of adding articles and users and updating them.

// console.log(localStorage.getItem("users"));

// console.log(localStorage.getItem("articles"));

// * Test the users.

// let usersString = localStorage.getItem("articles");
// let users = JSON.parse(usersString);
// for (let index = 0; index < users.length; index++) {
//   console.log(
//     "name:" +
//       users[index].header +
//       " token:" +
//       users[index].author +
//       " password: " +
//       users[index].content +
//       users[index].id +
//       users[index].img
//   );
// }

// deleteArticle(3);

// editArticle(5, {
//   author: "Khaled_saeed"
// });

// editArticle(8, {
//   author: "Khaled_saeed"
// });

// editArticle(1, {
//   author: "Khaled_saeed"
// });

// editArticle(2, {
//   author: "Abdullah_abdulrahman"
// });
// editArticle(7, {
//   author: "Abdullah_abdulrahman"
// });
// editArticle(4, {
//   author: "Abdullah_abdulrahman"
// });
// editArticle(3, {
//   author: "Zaid_hareth"
// });
// editArticle(6, {
//   author: "Zaid_hareth"
// });

// console.log(localStorage.getItem("articles"));

// addArticle(
//   "Future Trends in Programming",
//   "Sarah Johnson",
//   "March 19, 2025",
//   "./photos/Future Trends.jpg",
//   10,
//   `
//     <p>
//         Programming continues to evolve rapidly, with trends like AI-driven
//         development, blockchain technology, and decentralized applications
//         expected to play a significant role in the coming years. One of the key
//         shifts on the horizon is the growing influence of artificial
//         intelligence in coding. AI-powered tools, such as code completion
//         software and automated testing, are already transforming how developers
//         work by speeding up repetitive tasks and improving overall efficiency.
//         With advancements in machine learning, AI will likely enable more
//         sophisticated forms of automation, allowing developers to focus on
//         higher-level problem solving and creative aspects of software
//         development.
//       </p>
//       <p>
//         Another major trend is the increasing popularity of low-code and no-code
//         platforms. These tools allow individuals with little to no coding
//         experience to create applications, democratizing software development.
//         This shift is already making it easier for businesses to quickly
//         prototype solutions and customize software for their needs without
//         waiting for specialized developers. In addition to being a time-saver,
//         these platforms also help bridge the gap between traditional IT
//         departments and business teams, facilitating better collaboration.
//       </p>
//       <p>
//         Quantum computing is another frontier that is expected to make waves in
//         programming. Though still in its infancy, quantum computers promise to
//         solve complex problems that are beyond the reach of classical computers.
//         This could revolutionize industries like cryptography, pharmaceuticals,
//         and logistics, where large-scale computations are required. As quantum
//         computing matures, developers will need to familiarize themselves with
//         quantum programming languages and principles.
//       </p>
//       <p>
//         Furthermore, environmental sustainability will become a more prominent
//         factor in programming as we move towards greener technology.
//         Energy-efficient algorithms will be a priority as businesses look for
//         ways to reduce their carbon footprint. This trend will not only impact
//         software development but also data center operations, where energy
//         consumption is a growing concern. Programmers will need to optimize code
//         for performance and energy efficiency, ensuring that applications
//         consume minimal resources.
//       </p>
//     `
// );

// addArticle(
//   "The Importance of Web Development Skills",
//   "David Lee",
//   "April 2, 2025",
//   "./photos/web_develpment.jpg",
//   7,
//   `
//     <p>
//         In today's digital age, web development skills are more important than
//         ever. The internet has become an integral part of our daily lives, and
//         businesses of all sizes rely on websites and web applications to reach
//         their customers. Whether it's a small local shop or a multinational
//         corporation, an online presence is crucial for staying competitive. As a
//         result, the demand for skilled web developers continues to grow.
//       </p>
//       <p>
//         One of the key advantages of web development is its versatility. Web
//         developers work on both the frontend and backend of websites and
//         applications, giving them a wide range of responsibilities. On the
//         frontend, developers create the user interface, ensuring that the
//         website is visually appealing and easy to navigate. This requires a
//         strong understanding of HTML, CSS, and JavaScript, as well as modern
//         frameworks like React, Angular, and Vue.js. On the backend, developers
//         handle the server-side logic and database interactions, using
//         technologies like Node.js, Python, Ruby, and PHP.
//       </p>
//       <p>
//         In addition to technical skills, web developers also need to have a
//         strong understanding of user experience (UX) and search engine
//         optimization (SEO). UX ensures that the website is user-friendly and
//         meets the needs of its audience, while SEO helps the website rank higher
//         in search engine results, driving more traffic to the site. With so many
//         factors to consider, web development is a highly interdisciplinary field
//         that requires both creative and analytical thinking.
//       </p>
//       <p>
//         As the internet continues to evolve, web development skills will only
//         become more valuable. New technologies like progressive web apps (PWAs),
//         single-page applications (SPAs), and WebAssembly are already changing
//         the way we build websites and applications. PWAs, for example, combine
//         the best features of web and mobile apps, providing a seamless user
//         experience across devices. SPAs offer faster load times and smoother
//         navigation, while WebAssembly allows developers to run high-performance
//         code in the browser.
//       </p>
//     `
// );

// addArticle(
//   "Common Programming Languages for Beginners",
//   "Emily Carter",
//   "April 10, 2025",
//   "./photos/programming languages.jpg",
//   12,
//   `
//     <p>
//         Choosing the right programming language when starting your coding
//         journey can be overwhelming, but there are a few that are ideal for
//         beginners. Python, JavaScript, and Ruby stand out as excellent choices
//         due to their simplicity, readability, and wide range of applications.
//         Each of these languages offers a gentle learning curve, making them
//         perfect for anyone new to the world of programming.
//       </p>
//       <p>
//         Python is often the go-to language for beginners, and for good reason.
//         Its syntax is straightforward and closely resembles English, which makes
//         it easier for novices to grasp basic programming concepts. Python is
//         also a versatile language that can be used for web development, data
//         analysis, artificial intelligence, and more. Its extensive libraries and
//         frameworks, like Django and Flask, allow developers to build robust
//         applications with minimal effort. Additionally, Python has a large and
//         supportive community, which means that beginners can find plenty of
//         resources and tutorials to help them along the way.
//       </p>
//       <p>
//         JavaScript is another popular choice for beginners, especially for those
//         interested in web development. JavaScript is the language of the web,
//         and it powers the interactive elements of websites. Learning JavaScript
//         gives beginners the ability to create dynamic web pages and web
//         applications. The language is widely used in both frontend and backend
//         development, thanks to frameworks like React, Angular, and Node.js. By
//         mastering JavaScript, beginners can quickly move from building static
//         websites to developing fully-fledged web applications.
//       </p>
//       <p>
//         Ruby is known for its simplicity and productivity. The Ruby on Rails
//         framework has been instrumental in popularizing the language, especially
//         for web development. Ruby's syntax is designed to be intuitive and easy
//         to read, which is why it is often recommended to beginners who want to
//         focus on getting their ideas up and running quickly. While not as
//         versatile as Python, Ruby excels in rapid web development and has been
//         used to build popular websites like GitHub, Shopify, and Basecamp.
//       </p>
//     `
// );

// addArticle(
//   "Why Mobile Development is Still Relevant",
//   "Michael Brown",
//   "April 18, 2025",
//   "./photos/mobile development.jpg",
//   18,
//   `
//     <p>
//         Mobile development remains one of the most important fields in software
//         development, despite the rise of web applications and desktop software.
//         With billions of smartphone users worldwide, mobile apps are a critical
//         tool for businesses and organizations to reach their audience. Whether
//         it’s for entertainment, productivity, or commerce, mobile applications
//         play a central role in our daily lives, and the demand for high-quality
//         mobile apps is not slowing down anytime soon.
//       </p>
//       <p>
//         Mobile development allows developers to create native applications for
//         specific platforms, such as iOS or Android. Native apps are known for
//         their superior performance and user experience, as they are built
//         specifically for the platform they run on. In contrast, web apps, while
//         easier to develop and deploy across multiple platforms, often lack the
//         performance and native features of mobile apps. This makes mobile
//         development a critical skill for developers looking to create
//         high-quality, platform-specific experiences.
//       </p>
//       <p>
//         In addition to native development, cross-platform development frameworks
//         like Flutter and React Native have gained popularity in recent years.
//         These frameworks allow developers to write a single codebase that can be
//         deployed on both iOS and Android. This approach significantly reduces
//         development time and costs, making it an attractive option for startups
//         and smaller teams. However, native development is still preferred for
//         more complex apps that require fine-tuned performance and access to
//         platform-specific features.
//       </p>
//       <p>
//         The rise of mobile gaming, mobile commerce, and mobile-first strategies
//         for businesses ensures that mobile development will remain relevant for
//         the foreseeable future. Mobile games account for a significant portion
//         of app downloads, and the mobile gaming industry continues to grow. In
//         the business world, mobile commerce is becoming more popular as
//         consumers increasingly prefer to shop on their phones. This shift in
//         consumer behavior has led businesses to adopt a mobile-first strategy,
//         focusing on optimizing their websites and apps for mobile devices.
//       </p>
//     `
// );

// addArticle(
//   "How AI is Changing Software Development",
//   "Linda Martinez",
//   "April 26, 2025",
//   "./photos/SEO Techniques.jpg",
//   27,
//   `
//     <p>
//         Artificial intelligence (AI) is revolutionizing the way software is
//         developed, bringing new levels of efficiency and innovation to the
//         field. AI is being integrated into various aspects of the software
//         development lifecycle, from code generation to debugging and testing. By
//         automating many of the repetitive tasks that developers face, AI is
//         helping teams build software faster and with fewer errors.
//       </p>
//       <p>
//         One of the most significant ways AI is impacting software development is
//         through code completion tools. AI-powered tools like GitHub Copilot and
//         Tabnine use machine learning algorithms to suggest code snippets as
//         developers write. These tools analyze the context of the code being
//         written and provide intelligent suggestions that can save developers
//         time and reduce the likelihood of mistakes. This is especially helpful
//         for complex or repetitive tasks, where the AI can automatically generate
//         boilerplate code, allowing developers to focus on more critical aspects
//         of their projects.
//       </p>
//       <p>
//         In addition to code completion, AI is also improving the debugging and
//         testing process. AI-powered debugging tools can identify potential
//         issues in code faster than traditional methods, allowing developers to
//         resolve problems more quickly. Similarly, AI-driven testing tools can
//         automatically generate test cases and run them, ensuring that the
//         software is thoroughly tested without requiring manual intervention.
//         This leads to more robust and reliable software, as well as shorter
//         development cycles.
//       </p>
//       <p>
//         AI is also playing a role in the development of intelligent software
//         systems. Machine learning algorithms are being used to create software
//         that can learn and adapt over time. This opens up new possibilities for
//         applications that can improve themselves based on user behavior and
//         feedback. For example, recommendation engines, chatbots, and
//         personalized content delivery systems all rely on AI to provide a more
//         tailored and efficient user experience.
//       </p>
//     `
// );

// addArticle(
//   "The Future of Cloud Computing in Software Development",
//   "James Wilson",
//   "May 4, 2025",
//   "./photos/cloud computing.jpg",
//   37,
//   `
//     <p>
//         Cloud computing has become one of the most influential technologies
//         shaping the modern world of software development. Its ability to offer
//         scalable, flexible, and cost-efficient infrastructure has transformed
//         how applications are built, deployed, and managed. But what does the
//         future hold for cloud computing in the software development landscape?
//       </p>
//       <p>
//         As cloud providers continue to innovate, we can expect significant
//         advancements in the tools and services available to developers. The
//         integration of artificial intelligence (AI) and machine learning (ML)
//         into cloud platforms is already enabling more automated and intelligent
//         development workflows. Additionally, serverless architecture is gaining
//         traction, allowing developers to focus on code without worrying about
//         the underlying infrastructure.
//       </p>
//       <p>
//         Another key trend is the rise of multi-cloud and hybrid cloud
//         strategies. Organizations are increasingly opting for solutions that
//         allow them to leverage the strengths of multiple cloud providers or
//         integrate on-premises infrastructure with public cloud services. This
//         trend offers greater flexibility, cost optimization, and security for
//         software development teams.
//       </p>
//       <p>
//         Security and compliance will also remain central concerns. As more
//         sensitive data is stored and processed in the cloud, ensuring robust
//         security measures and compliance with regulations will be critical.
//         Cloud providers are expected to offer more advanced security features to
//         help developers build secure applications.
//       </p>
//       <p>
//         In conclusion, the future of cloud computing in software development is
//         bright. With innovations in AI, serverless architecture, multi-cloud
//         strategies, and enhanced security, developers have a wealth of
//         opportunities to build the next generation of applications.
//       </p>
//     `
// );

// addArticle(
//   "The Role of Cybersecurity in Modern Web Applications",
//   "Olivia Davis",
//   "May 12, 2025",
//   "./photos/cybersecuricy.jpg",
//   7,
//   `
//     <p>
//         With the rise of web applications that handle sensitive data and perform
//         critical operations, cybersecurity has become a top priority for
//         developers and organizations alike. As cyberattacks become more
//         sophisticated, it is essential to adopt strong security measures in the
//         development of web applications.
//       </p>
//       <p>
//         One of the most common cybersecurity threats facing web applications is
//         the injection attack, where malicious code is inserted into input
//         fields. Developers need to implement strict input validation and
//         sanitization to prevent such attacks. Additionally, the use of HTTPS
//         protocols ensures that data transmitted between the server and the
//         client is encrypted and protected from interception.
//       </p>
//       <p>
//         Another major concern is authentication and authorization. Weak password
//         policies, poorly implemented authentication systems, and improper access
//         controls can all lead to data breaches. Modern web applications must
//         adopt secure authentication practices such as multi-factor
//         authentication (MFA) and use encryption techniques to store user
//         credentials safely.
//       </p>
//       <p>
//         Beyond preventing attacks, web developers also need to consider how they
//         will detect and respond to security incidents. Integrating real-time
//         monitoring and incident response plans into the development process
//         ensures that threats can be identified and mitigated before they cause
//         significant harm.
//       </p>
//       <p>
//         In the future, we can expect further advancements in cybersecurity
//         solutions for web applications, including the use of artificial
//         intelligence and machine learning to predict and prevent threats. As web
//         development continues to evolve, security will remain a critical focus,
//         protecting users and organizations from emerging threats.
//       </p>
//     `
// );

// addArticle(
//   "The Evolution of Frontend Frameworks",
//   "Sophia Martinez",
//   "May 17, 2025",
//   "./photos/frontEnd development.jpg",
//   5,
//   `
//     <p>
//         Frontend development has come a long way from the early days of static
//         HTML pages. Over the years, we have seen the rise of sophisticated
//         frontend frameworks that have revolutionized how web applications are
//         built and delivered to users. These frameworks simplify the process of
//         building responsive, dynamic, and interactive user interfaces.
//       </p>
//       <p>
//         One of the earliest frontend frameworks that gained widespread adoption
//         was Angular. Developed by Google, Angular introduced a comprehensive
//         approach to building single-page applications (SPAs) with two-way data
//         binding, dependency injection, and a powerful templating engine. It set
//         the stage for modern JavaScript frameworks and gave developers the tools
//         they needed to create complex applications efficiently.
//       </p>
//       <p>
//         Following Angular, React emerged as a highly popular and flexible
//         frontend framework developed by Facebook. React introduced the concept
//         of component-based architecture, allowing developers to create reusable
//         UI components. Its virtual DOM and efficient rendering process made
//         React a favorite for developers looking to build high-performance
//         applications.
//       </p>
//       <p>
//         In recent years, Vue.js has gained popularity for its simplicity and
//         ease of integration. Vue offers a progressive framework that can be
//         incrementally adopted, making it ideal for both small projects and
//         large-scale applications. It combines the best features of Angular and
//         React, providing a flexible and performant solution for frontend
//         development.
//       </p>
//       <p>
//         As frontend frameworks continue to evolve, developers are seeing more
//         emphasis on developer experience, performance optimization, and better
//         support for modern web standards. With tools like Svelte and new
//         features in established frameworks, the future of frontend development
//         promises even more exciting innovations.
//       </p>
//     `
// );

// localStorage.removeItem("articles");
// console.log(localStorage.getItem("articles"));
