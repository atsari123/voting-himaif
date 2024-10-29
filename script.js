import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Inisialisasi Supabase
const supabaseUrl = "https://qsnrixkryqidfvbrfsjq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbnJpeGtyeXFpZGZ2YnJmc2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNTA1OTUsImV4cCI6MjA0NTcyNjU5NX0.6sVuK29WbrA2vy7k6lNlO4OVXA1SPU4OJdWMezpubhg";
const supabase = createClient(supabaseUrl, supabaseKey);

// State management
let currentUser = null;
let isAdminUser = false;

// Admin email - ganti dengan email admin Anda
const ADMIN_EMAIL = "afiqatsari@gmail.com";


// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  const voteButtons = document.querySelectorAll(".vote-button");
  voteButtons.forEach((button) => {
    button.disabled = true;
    button.textContent = "Login untuk memilih";
  });

  checkSession();
});

// Check session dan status admin
async function checkSession() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getSession();
  if (user) {
    currentUser = user;
    // Cek apakah email user adalah email admin
    isAdminUser = user.email === ADMIN_EMAIL;
    handleAuthenticatedState();
  }
}

// Handle authenticated state
function handleAuthenticatedState() {
  document.getElementById("logout-item").style.display = "block";
  document.getElementById("login-item").style.display = "none";
  document.getElementById("signup-item").style.display = "none";

  if (isAdminUser) {
    // Tambahkan menu admin
    const adminMenuItem = document.createElement("li");
    adminMenuItem.className = "nav-item";
    adminMenuItem.id = "admin-menu";
    adminMenuItem.innerHTML = `
            <a class="nav-link" href="#" onclick="toggleAdminPanel(event)">
                Admin Panel
            </a>
        `;

    const navbarNav = document.querySelector(".navbar-nav");
    navbarNav.insertBefore(
      adminMenuItem,
      document.getElementById("logout-item")
    );
  }

  enableVotingIfEligible();
}

// Sign up handler
document
  .getElementById("signup-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      const signupModal = bootstrap.Modal.getInstance(
        document.getElementById("signup")
      );
      signupModal.hide();

      const verificationModal = new bootstrap.Modal(
        document.getElementById("verificationModal")
      );
      verificationModal.show();

      setTimeout(() => {
        verificationModal.hide();
        const loginModal = new bootstrap.Modal(
          document.getElementById("login")
        );
        loginModal.show();
      }, 3000);
    } catch (error) {
      console.error("Sign-up error:", error); // Menampilkan detail error di konsol
      alert("Gagal mendaftar: " + error.message); // Menampilkan error di UI
    }
  });

// Login handler
document
  .getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      currentUser = user;
      isAdminUser = user.email === ADMIN_EMAIL;

      document.getElementById("login-form").reset();
      const loginModal = bootstrap.Modal.getInstance(
        document.getElementById("login")
      );
      loginModal.hide();

      handleAuthenticatedState();
    } catch (error) {
      alert(error.message);
    }
  });

// Logout handler
document.getElementById("logout").addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    isAdminUser = false;

    // Reset UI
    document.getElementById("logout-item").style.display = "none";
    document.getElementById("login-item").style.display = "block";
    document.getElementById("signup-item").style.display = "block";

    const adminMenu = document.getElementById("admin-menu");
    if (adminMenu) adminMenu.remove();

    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) adminPanel.remove();

    // Disable voting buttons
    const voteButtons = document.querySelectorAll(".vote-button");
    voteButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = "Login untuk memilih";
    });
  } catch (error) {
    alert(error.message);
  }
});

// Check if user has voted
async function hasUserVoted() {
  if (!currentUser) return false;

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Error checking vote status:", error);
    return false;
  }

  return data && data.length > 0;
}

// Enable voting if eligible
async function enableVotingIfEligible() {
  const hasVoted = await hasUserVoted();
  const voteButtons = document.querySelectorAll(".vote-button");

  voteButtons.forEach((button) => {
    if (hasVoted) {
      button.disabled = true;
      button.textContent = "Anda sudah memilih";
    } else {
      button.disabled = false;
      button.textContent = `Pilih ${button.dataset.candidate}`;
    }
  });
}

// Admin Panel Toggle
window.toggleAdminPanel = async function (event) {
  event.preventDefault();

  if (!isAdminUser) return;

  let adminPanel = document.getElementById("admin-panel");

  if (adminPanel) {
    adminPanel.style.display =
      adminPanel.style.display === "none" ? "block" : "none";
    return;
  }

  adminPanel = document.createElement("div");
  adminPanel.id = "admin-panel";
  adminPanel.className = "container mt-5";
  adminPanel.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Panel Admin - Hasil Pemilihan</h5>
                <button class="btn btn-primary btn-sm" onclick="exportToExcel()">
                    Export to Excel
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col">
                        <div class="alert alert-info">
                            Total Pemilih: <span id="total-voters">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Kandidat</th>
                                <th>Total Suara</th>
                                <th>Persentase</th>
                            </tr>
                        </thead>
                        <tbody id="results-tbody">
                            <tr>
                                <td colspan="3" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

  const footer = document.getElementById("footer");
  footer.parentNode.insertBefore(adminPanel, footer);

  loadVoteResults();
};

// Load vote results
async function loadVoteResults() {
  if (!isAdminUser) return;

  try {
    const { count: totalVoters } = await supabase
      .from("votes")
      .select("*", { count: "exact" });

    document.getElementById("total-voters").textContent = totalVoters;

    const { data: results, error } = await supabase
      .from("vote_counts")
      .select("*")
      .order("total_votes", { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById("results-tbody");
    tbody.innerHTML = results
      .map(
        (result) => `
            <tr>
                <td>${result.candidate_id}</td>
                <td>${result.total_votes}</td>
                <td>${result.vote_percentage}%</td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading vote results:", error);
    alert("Gagal memuat hasil voting");
  }
}

// Export to Excel
window.exportToExcel = function () {
  if (!isAdminUser) return;

  const table = document.querySelector(".table");
  const ws = XLSX.utils.table_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Voting");
  XLSX.writeFile(
    wb,
    `hasil_voting_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};

// Handle voting
document.addEventListener("click", async (event) => {
  if (!event.target.matches(".vote-button")) return;

  if (!currentUser) {
    const loginModal = new bootstrap.Modal(document.getElementById("login"));
    loginModal.show();
    return;
  }

  try {
    const candidateId = event.target.dataset.candidate;

    const hasVoted = await hasUserVoted();
    if (hasVoted) {
      alert("Anda sudah memilih!");
      return;
    }

    const { data, error } = await supabase.from("votes").insert([
      {
        user_id: currentUser.id,
        candidate_id: candidateId,
      },
    ]);

    if (error) throw error;

    const thankYouModal = new bootstrap.Modal(
      document.getElementById("thankYouModal")
    );
    thankYouModal.show();

    const voteButtons = document.querySelectorAll(".vote-button");
    voteButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = "Anda sudah memilih";
    });
  } catch (error) {
    alert(error.message);
  }
});
