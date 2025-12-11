document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoInput = document.getElementById('todo-input');
    const todoDateInput = document.getElementById('todo-date');
    const todoPriorityInput = document.getElementById('todo-priority');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // View Toggle Elements
    const listViewBtn = document.getElementById('list-view-btn');
    const calendarViewBtn = document.getElementById('calendar-view-btn');
    const listViewContainer = document.getElementById('list-view-container');
    const calendarViewContainer = document.getElementById('calendar-view-container');

    // Calendar Elements
    const currentMonthEl = document.getElementById('current-month');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // State
    let todos = JSON.parse(localStorage.getItem('premium_todos')) || [];
    let currentFilter = 'all';
    let currentDate = new Date(); // For calendar view

    // Functions
    function saveTodos() {
        localStorage.setItem('premium_todos', JSON.stringify(todos));
        renderTodos();
        renderCalendar();
    }

    function createTodoItem(text, date, priority) {
        return {
            id: Date.now(),
            text: text,
            dueDate: date, // YYYY-MM-DD string
            priority: priority || 'medium', // low, medium, high
            completed: false,
            createdAt: new Date().toISOString()
        };
    }

    // Capture inputs in addTodo
    function addTodo() {
        const text = todoInput.value.trim();
        const date = todoDateInput.value;
        const priority = todoPriorityInput.value;
        const start = startTimeInput.value;
        const end = endTimeInput.value;
        const offset = reminderOffsetInput.value;

        if (text) {
            const newTodo = {
                id: Date.now(),
                text: text,
                dueDate: date,
                startTime: start,
                endTime: end,
                reminderOffset: offset,
                priority: priority || 'medium',
                completed: false,
                notified: false,
                createdAt: new Date().toISOString()
            };

            todos.unshift(newTodo);
            saveTodos();

            // Reset fields
            todoInput.value = '';
            todoDateInput.value = '';
            startTimeInput.value = '';
            endTimeInput.value = '';
            todoPriorityInput.value = 'medium';
        }
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
    }

    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
    }

    function getFilteredTodos() {
        switch (currentFilter) {
            case 'active':
                return todos.filter(todo => !todo.completed);
            case 'completed':
                return todos.filter(todo => todo.completed);
            default:
                return todos;
        }
    }

    function formatDateDisplay(dateString) {
        if (!dateString) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function isOverdue(dateString, completed) {
        if (!dateString || completed) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateString);
        // We consider it overdue if the due date is strictly before today
        // (Due today is not overdue until tomorrow)
        return due < today;
    }

    // Update Render to show times
    function renderTodos() {
        todoList.innerHTML = '';
        const filteredTodos = getFilteredTodos();

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`;

            const isLate = isOverdue(todo.dueDate, todo.completed);

            let timeDisplay = '';
            if (todo.startTime) {
                timeDisplay += ` • ${formatTime(todo.startTime)}`;
                if (todo.endTime) {
                    timeDisplay += ` - ${formatTime(todo.endTime)}`;
                }
            }

            const dateDisplay = todo.dueDate ?
                `<span class="todo-date ${isLate ? 'overdue' : ''}">
                    <i class="far fa-calendar"></i> ${formatDateDisplay(todo.dueDate)}${timeDisplay}
                 </span>` : '';

            li.innerHTML = `
                <button class="check-btn" onclick="app.toggle(${todo.id})">
                    <i class="fas fa-check"></i>
                </button>
                <div class="todo-content">
                    <span class="todo-text">${escapeHtml(todo.text)}</span>
                    ${dateDisplay}
                </div>
                <button class="delete-btn" onclick="app.delete(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            todoList.appendChild(li);
        });

        const activeCount = todos.filter(t => !t.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    function formatTime(timeStr) {
        // timeStr is HH:mm (24h)
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${minutes} ${ampm}`;
    }

    // isOverdue needs update to respect time?
    function isOverdue(dateString, completed) {
        if (!dateString || completed) return false;
        const now = new Date();
        const due = new Date(dateString);
        due.setHours(23, 59, 59); // End of due day
        return due < now;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /* --- Calendar Logic --- */

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Header Display
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
        currentMonthEl.textContent = `${monthName} ${year}`;

        // Days in month
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Days Names Header
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const div = document.createElement('div');
            div.className = 'calendar-day-header';
            div.textContent = day;
            calendarGrid.appendChild(div);
        });

        // Empty slots for previous month
        for (let i = 0; i < firstDayIndex; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            calendarGrid.appendChild(div);
        }

        // Days
        for (let i = 1; i <= lastDay; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.innerHTML = `<span>${i}</span>`;

            // Check if today
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            // Find tasks for this day
            // Helper to match YYYY-MM-DD local time
            // We construct the string "YYYY-MM-DD" for this day 'i'
            // Careful with months (0-indexed) and padding
            const monthStr = (month + 1).toString().padStart(2, '0');
            const dayStr = i.toString().padStart(2, '0');
            const dateString = `${year}-${monthStr}-${dayStr}`;

            const dayTasks = todos.filter(t => t.dueDate === dateString);

            if (dayTasks.length > 0) {
                const indicatorDiv = document.createElement('div');
                indicatorDiv.className = 'dot-indicator';

                // Show up to 3 dots
                dayTasks.slice(0, 3).forEach(task => {
                    const dot = document.createElement('div');
                    dot.className = `dot ${task.completed ? 'completed' : ''}`;
                    indicatorDiv.appendChild(dot);
                });
                dayDiv.appendChild(indicatorDiv);
            }

            calendarGrid.appendChild(dayDiv);
        }
    }

    // Event Listeners
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const reminderOffsetInput = document.getElementById('reminder-offset');

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // View Toggles
    listViewBtn.addEventListener('click', () => {
        listViewContainer.classList.remove('hidden');
        calendarViewContainer.classList.add('hidden');
        listViewBtn.classList.add('active');
        calendarViewBtn.classList.remove('active');
    });

    calendarViewBtn.addEventListener('click', () => {
        calendarViewContainer.classList.remove('hidden');
        listViewContainer.classList.add('hidden');
        calendarViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderCalendar(); // Refresh calendar when showing
    });

    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    /* --- PWA & Notification Logic --- */

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed: ', err));
        });
    }

    // Notification Logic
    const notifyBtn = document.getElementById('notify-btn');

    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            notifyBtn.style.display = 'inline-block';
        }

        notifyBtn.addEventListener('click', () => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    notifyBtn.style.display = 'none';
                    new Notification('Focus App', {
                        body: 'Notifications enabled! We will remind you of tasks.'
                    });
                }
            });
        });
    }

    // Check for due tasks every minute
    setInterval(checkDueTasks, 60000);

    function checkDueTasks() {
        if (Notification.permission !== 'granted') return;

        const now = new Date();

        todos.forEach(todo => {
            if (!todo.completed && !todo.notified && todo.dueDate) {

                // Logic: 
                // 1. Construct the Task Start Time (Date + StartTime)
                // 2. Subtract Reminder Offset (minutes)
                // 3. Compare with 'now'

                let taskDateTime;
                if (todo.startTime) {
                    taskDateTime = new Date(`${todo.dueDate}T${todo.startTime}`);
                } else {
                    // Default to 9 AM if no time set but date exists
                    taskDateTime = new Date(`${todo.dueDate}T09:00:00`);
                }

                const offsetMinutes = parseInt(todo.reminderOffset || 0);
                const notificationTime = new Date(taskDateTime.getTime() - offsetMinutes * 60000);

                // Notify if within the minute of the trigger time (or slightly past it if missed)
                // We check if now >= notificationTime AND now < notificationTime + 5 mins (window)
                // actually simplest is just: if now > notificationTime && !notified

                if (now >= notificationTime) {
                    new Notification(todo.text, {
                        body: `Reminder: Task is starting soon (${todo.startTime || 'Today'})`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png'
                    });

                    todo.notified = true;
                    saveTodos();
                }
            }
        });
    }

    // Global Exposure
    window.app = {
        toggle: toggleTodo,
        delete: deleteTodo
    };

    // Initial Render
    renderTodos();
    renderCalendar();
});
