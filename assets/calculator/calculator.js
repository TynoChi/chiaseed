/* =====================================================
   Clean Scientific Calculator Logic (FX-570EX style)
   (c) https://www.calculator.net — Rewritten by ChatGPT
   ===================================================== */

class StackItem {
    constructor(value = 0, op = "", prec = 0) {
        this.value = value;
        this.op = op;
        this.prec = prec;
    }
}

class Calculator {
    constructor(displayId = "sciOutPut") {
        // Constants
        this.TOTAL_DIGITS = 12;
        this.STACK_SIZE = 12;
        
        // State
        this.DEGREE_MODE = "degree"; // or "radian"
        this.value = 0;
        this.memory = 0;
        this.stack = [];
        this.entered = true;
        this.decimal = 0;
        this.fixed = 0;
        this.exponentMode = false;
        this.digits = 0;
        this.exponentValue = 0;
        this.displayEl = document.getElementById(displayId);
        if (this.displayEl) {
          this.refresh();
        } else {
          console.error(`Calculator display element with ID "${displayId}" not found.`);
        }
    }
    
    setMode(mode) {
        this.DEGREE_MODE = mode;
    }

    // ---------- Utility ----------
    format(num) {
        if (isNaN(num) || !isFinite(num)) return "Error";

        let str = num.toPrecision(this.TOTAL_DIGITS);
        if (str.includes("e")) {
            const [base, exp] = str.split("e");
            return `${parseFloat(base)} &times;10<sup>${exp}</sup>`;
        }

        const [intPart, fracPart = ""] = num.toString().split(".");
        
        if (num.toString().length > this.TOTAL_DIGITS) {
           if (intPart.length > this.TOTAL_DIGITS) {
               return num.toExponential(this.TOTAL_DIGITS - 5).replace("e+", " &times;10<sup>") + "</sup>";
           }
           let availableDigits = this.TOTAL_DIGITS - intPart.length - (intPart.startsWith('-') ? 0 : 1);
           return num.toFixed(Math.max(0, availableDigits));
        }

        if (fracPart.length === 0 && (this.entered || this.decimal > 0)) {
            return intPart + ".";
        }
        
        return num.toString();
    }

    refresh() {
        let text = this.format(this.value);
        if (this.exponentMode) {
            text += this.exponentValue >= 0 ? ` +${this.exponentValue}` : ` ${this.exponentValue}`;
        }
        if (this.displayEl) {
            this.displayEl.innerHTML = text || "0";
        }
    }

    // ---------- Stack ----------
    push(value, op, prec) {
        if (this.stack.length >= this.STACK_SIZE) return false;
        this.stack.unshift(new StackItem(value, op, prec));
        return true;
    }

    pop() {
        return this.stack.shift() || null;
    }

    evalTop() {
        if (this.stack.length === 0) return false;
        const { value: a, op } = this.pop();
        switch (op) {
            case "+": this.value = a + this.value; break;
            case "-": this.value = a - this.value; break;
            case "*": this.value = a * this.value; break;
            case "/": this.value = a / this.value; break;
            case "pow": this.value = Math.pow(a, this.value); break;
            case "apow": this.value = Math.pow(a, 1 / this.value); break;
            default: break;
        }
        return op !== "(";
    }

    // ---------- Entry ----------
    enter() {
        if (this.exponentMode) {
            this.value *= Math.pow(10, this.exponentValue);
        }
        this.entered = true;
        this.exponentMode = false;
        this.decimal = 0;
        this.fixed = 0;
    }

    // ---------- Button Dispatcher ----------
    press(key) {
        if (typeof key === "number" || /^\d$/.test(key)) {
            this.inputDigit(Number(key));
            return;
        }

        const funcs = [
            "10x","log","ex","ln","sin","asin","cos","acos","tan","atan",
            "e","pi","n!","x2","1/x","swap","x3","3x","RND","M-","qc",
            "MC","MR","MS","M+","sqrt","pc","log2"
        ];
        if (funcs.includes(key)) return this.func(key);

        const ops = ["pow","apow","+","-","*","/"];
        if (ops.includes(key)) return this.operator(key);

        switch (key) {
            case "(": this.parenOpen(); break;
            case ")": this.parenClose(); break;
            case "EXP": this.expMode(); break;
            case ".": this.decimalPoint(); break;
            case "+/-": this.toggleSign(); break;
            case "C": this.clear(); break;
            case "=": this.evaluateAll(); break;
            default: break;
        }
    }

    // ---------- Input handlers ----------
    inputDigit(d) {
        if (this.entered) {
            this.value = 0;
            this.digits = 0;
            this.entered = false;
        }
        if (this.exponentMode) {
            if (this.exponentValue < 0) d = -d;
            if (this.digits < 3) {
                this.exponentValue = this.exponentValue * 10 + d;
                this.digits++;
                this.refresh();
            }
            return;
        }
        if (this.value < 0) d = -d;
        if (this.digits < this.TOTAL_DIGITS - 1) {
            this.digits++;
            if (this.decimal > 0) {
                this.decimal *= 10;
                this.value += d / this.decimal;
                this.fixed++;
            } else {
                this.value = this.value * 10 + d;
            }
        }
        this.refresh();
    }

    decimalPoint() {
        if (this.entered) {
            this.value = 0;
            this.digits = 1;
        }
        this.entered = false;
        if (this.decimal === 0) this.decimal = 1;
        this.refresh();
    }

    toggleSign() {
        if (this.exponentMode) this.exponentValue = -this.exponentValue;
        else this.value = -this.value;
        this.refresh();
    }

    clear() {
        this.stack = [];
        this.value = 0;
        this.enter();
        this.refresh();
    }

    expMode() {
        if (this.entered || this.exponentMode) return;
        this.exponentMode = true;
        this.exponentValue = 0;
        this.digits = 0;
        this.decimal = 0;
        this.refresh();
    }

    // ---------- Parentheses ----------
    parenOpen() {
        this.enter();
        this.push(this.value, "(", 0);
        this.refresh();
    }

    parenClose() {
        this.enter();
        while(this.stack.length > 0 && this.stack[0].op !== '(') {
            this.evalTop();
        }
        if(this.stack.length > 0 && this.stack[0].op === '(') {
            this.pop(); // Pop the '('
        }
        this.refresh();
    }

    // ---------- Operations ----------
    operator(op) {
        this.enter();
        let prec = (op === "+" || op === "-") ? 1 : (op === "*" || op === "/") ? 2 : 3;
        while (this.stack.length > 0 && this.stack[0].op !== '(' && prec <= this.stack[0].prec) {
            this.evalTop();
        }
        this.push(this.value, op, prec);
        this.entered = true; // Ready for next number
        this.refresh();
    }

    evaluateAll() {
        this.enter();
        while (this.stack.length > 0) this.evalTop();
        this.refresh();
    }

    // ---------- Functions ----------
    func(key) {
        this.enter();
        const rad = this.DEGREE_MODE === "degree" ? Math.PI / 180 : 1;

        try {
            switch (key) {
                case "1/x": this.value = 1 / this.value; break;
                case "pc": this.value /= 100; break;
                case "qc": this.value /= 1000; break;
                case "swap":
                    if (this.stack.length > 0) {
                        const tmp = this.value;
                        this.value = this.stack[0].value;
                        this.stack[0].value = tmp;
                    }
                    break;
                case "n!":
                    if (this.value < 0 || this.value > 170 || this.value % 1 !== 0) this.value = NaN;
                    else {
                        let res = 1;
                        for (let i = 1; i <= this.value; i++) res *= i;
                        this.value = res;
                    }
                    break;
                case "MR": this.value = this.memory; break;
                case "M+": this.memory += this.value; break;
                case "MS": this.memory = this.value; break;
                case "MC": this.memory = 0; break;
                case "M-": this.memory -= this.value; break;
                case "sin": this.value = Math.sin(this.value * rad); break;
                case "cos": this.value = Math.cos(this.value * rad); break;
                case "tan": this.value = Math.tan(this.value * rad); break;
                case "asin": this.value = Math.asin(this.value) / rad; break;
                case "acos": this.value = Math.acos(this.value) / rad; break;
                case "atan": this.value = Math.atan(this.value) / rad; break;
                case "ln": this.value = Math.log(this.value); break;
                case "log": this.value = Math.log10(this.value); break;
                case "log2": this.value = Math.log2(this.value); break;
                case "sqrt": this.value = Math.sqrt(this.value); break;
                case "x2": this.value = Math.pow(this.value, 2); break;
                case "x3": this.value = Math.pow(this.value, 3); break;
                case "3x": this.value = Math.cbrt(this.value); break;
                case "10x": this.value = Math.pow(10, this.value); break;
                case "ex": this.value = Math.exp(this.value); break;
                case "e": this.value = Math.E; break;
                case "pi": this.value = Math.PI; break;
                case "RND": this.value = Math.random(); break;
                default: break;
            }
        } catch {
            this.value = NaN;
        }
        this.refresh();
    }
}