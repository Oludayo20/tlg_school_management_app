const addStudent = document.getElementById('addStudent');
const allStudent = document.getElementById('allStudent');
const form = document.querySelector('#form');
const table = document.querySelector('#table');
const inputFullName = document.querySelector('#fullName');
const inputClass = document.querySelector('#class');
const inputAge = document.querySelector('#age');
const inputImg = document.querySelector('#img');
const recentlyAddedStudentName = document.querySelector('#addedStudent');
const recentlyAddedStudentClass = document.querySelector('#addedClass');

ipcRenderer.send('student:fetch', 'jss1');

addStudent.addEventListener('click', function () {
  form.style.display = 'block';
  table.style.display = 'none';
});

allStudent.addEventListener('click', function () {
  ipcRenderer.send('student:fetch', 'jss1');
  table.style.display = 'block';
  form.style.display = 'none';
});

// Save Student
function saveStudent(e) {
  e.preventDefault();

  if (!inputFullName || !inputClass || !inputAge || !inputImg.files[0]) {
    alertError('All student data is required');
    return;
  }

  const fullName = inputFullName.value;
  const cls = inputClass.value;
  const age = inputAge.value;
  const imgPath = inputImg.files[0].path;

  ipcRenderer.send('student:add', {
    fullName,
    cls,
    age,
    imgPath
  });
}

// Get Students
ipcRenderer.on('student:fetched', (students) => {
  const studentList = document.getElementById('studentList');

  studentList.innerHTML = '';

  if (students.length !== 0) {
    students.forEach((student) => {
      const row = studentList.insertRow();
      row.insertCell(0).innerHTML = student.fullName;
      row.insertCell(1).innerHTML = student.cls;
      row.insertCell(2).innerHTML = student.age;

      const img = new Image();
      img.src = student.profilePic || '';
      img.classList.add('w-[2px]', 'h-[2px]', 'rounded-full', 'object-cover');
      const cell = row.insertCell(3);
      // cell.appendChild(img);
    });
  } else {
    const row = studentList.insertRow();
    row.insertCell(0).innerHTML = 'No Students';
    row.insertCell(1).innerHTML = 'Try adding some Students';
  }
});

// When done, show message
ipcRenderer.on('student:saved', (student) => {
  console.log(student);
  alertSuccess(
    `Student with name: ${student.fullName} and class: ${student.cls} saved successfully!!!`
  );
  recentlyAddedStudentName.innerHTML = student.fullName;
  recentlyAddedStudentClass.innerText = student.cls;
});

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: '#094F4B',
      color: 'white',
      textAlign: 'center'
    }
  });
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center'
    }
  });
}

// Form submit listener
form.addEventListener('submit', saveStudent);
