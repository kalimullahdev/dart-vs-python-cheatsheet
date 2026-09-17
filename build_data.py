import json

data = [
  # -------------------------------------------------------------
  # 1. CORE ARCHITECTURE & EXECUTION
  # -------------------------------------------------------------
  {
    "id": "compilation-and-execution",
    "category": "Core Architecture",
    "title": "Compilation & Execution Pipeline",
    "tags": ["AOT", "JIT", "Bytecode", "VM", "Compiler"],
    "summary": "How source code is transformed and executed on hardware or within the virtual machine.",
    "keyTakeaway": "Dart compiles to native machine code (AOT), runs JIT for dev, or emits JS/Wasm. Python executes bytecode on CPython VM.",
    "dartDoc": "https://dart.dev/overview#platform",
    "pythonDoc": "https://docs.python.org/3/reference/executionmodel.html",
    "dart": {
      "code": """// Dart execution targets (dart.dev/overview#platform):
// 1. Development: dart run (JIT with stateful Hot Reload)
// 2. Production:  dart compile exe main.dart -o app (AOT native binary)
// 3. Web:         dart compile js / dart compile wasm (WasmGC)

void main() {
  print('Dart native AOT machine code or JIT runtime');
}""",
      "inReality": """• Development (JIT): Dart VM parses source into Kernel AST binary, JIT-compiles hot functions to machine code with runtime profiling, and enables sub-second Hot Reload by live-patching method implementations directly in heap memory without resetting application state.
• Production (AOT): Whole-program tree-shaking strips all unused classes/methods, devirtualizes method dispatch, and emits a standalone machine-code binary (ARM64/x86_64) that needs no VM.
• Web: Compiles directly to clean ES/JS or modern WebAssembly with garbage collection (WasmGC) for near-native web execution."""
    },
    "python": {
      "code": """# Python execution model (docs.python.org/3/reference/executionmodel.html):
# 1. Source parsed into Abstract Syntax Tree (AST)
# 2. Bytecode generated & cached in __pycache__/*.pyc
# 3. Bytecode evaluated on CPython VM stack loop (ceval.c)

def main():
    print("Running on CPython Virtual Machine")

if __name__ == "__main__":
    main()""",
      "inReality": """• Bytecode Generation: CPython compiles Python source into bytecode opcodes (.pyc files cached in __pycache__), skipping parsing on subsequent launches.
• Virtual Machine Loop: CPython's evaluation loop (ceval.c) decodes and executes bytecode opcodes sequentially on a stack-based virtual machine.
• Tier-1 JIT (Python 3.11+ / 3.13+): The Adaptive Specializing Interpreter replaces generic opcodes with specialized opcodes (e.g. BINARY_OP_ADD_INT) when types stay stable.
• Distribution: Python cannot produce a true standalone native binary without bundling the entire CPython interpreter runtime and standard library (e.g. via PyInstaller)."""
    }
  },
  {
    "id": "memory-and-gc",
    "category": "Core Architecture",
    "title": "Memory Management & Garbage Collection",
    "tags": ["Memory", "Garbage Collection", "Heap", "Reference Counting"],
    "summary": "How objects are allocated in memory and reclaimed when no longer referenced.",
    "keyTakeaway": "Dart uses a two-generation generational GC optimized for rapid UI allocations. Python uses reference counting combined with a cyclical generational GC.",
    "dartDoc": "https://dart.dev/overview#runtime",
    "pythonDoc": "https://docs.python.org/3/c-api/memory.html",
    "dart": {
      "code": """class Point {
  final double x, y;
  Point(this.x, this.y);
}

void process() {
  // Rapid allocation of short-lived objects
  for (var i = 0; i < 100000; i++) {
    final p = Point(i.toDouble(), (i * 2).toDouble());
    // Collected in young generation nursery without pausing UI
  }
}""",
      "inReality": """• Generational GC: Optimized specifically for UI frame budgets (60fps/120fps Flutter rendering).
• Young Generation (Nursery): Objects are allocated into contiguous memory via a bump pointer (as fast as incrementing an integer address). A semi-space copying collector evacuates live objects with pause times well under 1-2 milliseconds.
• Old Generation: Long-lived objects promoted from the nursery are managed with concurrent marking and sweeping with compaction to eliminate memory fragmentation without halting threads.
• No Reference Counting Overhead: Pointers are simple memory addresses without reference count increments/decrements on every variable assignment."""
    },
    "python": {
      "code": """class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

def process():
    for i in range(100000):
        p = Point(float(i), float(i * 2))
        # Destroyed immediately when ob_refcnt hits 0""",
      "inReality": """• Reference Counting: Every Python object (PyObject) has an internal 64-bit 'ob_refcnt' header. Every assignment, function parameter pass, or container append increments this counter; going out of scope decrements it.
• Instant Deallocation: If an object's reference count drops to 0 and there are no cycles, its memory is freed immediately and deterministically.
• Cyclical Garbage Collector: Reference counting fails on circular references (e.g. A.child = B; B.parent = A). CPython runs a 3-generation (Gen 0, 1, 2) cyclical GC that periodically walks object graphs to break isolated cycles.
• Performance Cost: Constant reference count updates invalidate CPU cache lines and prevent multi-core scalability across threads."""
    }
  },
  {
    "id": "concurrency-model",
    "category": "Core Architecture",
    "title": "Concurrency: Isolates vs. Threads & GIL",
    "tags": ["Concurrency", "Isolates", "Threads", "GIL", "Async"],
    "summary": "How multi-core CPU parallelism, thread safety, and memory isolation are achieved.",
    "keyTakeaway": "Dart runs isolated memory heaps (Isolates) communicating via message-passing (no shared memory locks). Python threads share memory but are serialized by the GIL.",
    "dartDoc": "https://dart.dev/language/concurrency",
    "pythonDoc": "https://docs.python.org/3/library/asyncio.html",
    "dart": {
      "code": """import 'dart:isolate';

// Official Dart Concurrency: All Dart code runs in isolates
void heavyWorker(SendPort sendPort) {
  int total = 0;
  for (int i = 0; i < 100000000; i++) total += i;
  sendPort.send(total); // Message passed across isolated heaps
}

void main() async {
  final receivePort = ReceivePort();
  await Isolate.spawn(heavyWorker, receivePort.sendPort);
  final result = await receivePort.first;
  print('Result from isolate: $result');
}""",
      "inReality": """• Zero Shared Memory: Each Dart Isolate has its own private heap memory, garbage collector, and event loop.
• No Mutexes / Data Races: Because heaps are completely isolated, race conditions on Dart variables are architecturally impossible. No locks, semaphores, or synchronized blocks needed.
• Message Passing: Messages sent across SendPort/ReceivePort are either copied deeply, or transferred with zero copy for typed memory buffers (TransferableTypedData transfers ownership in O(1) time).
• True Multi-Core: 8 Isolates utilize 8 physical CPU cores simultaneously at 100% capacity without interference."""
    },
    "python": {
      "code": """import threading
from multiprocessing import Process, Queue

# 1. Threading (CPython GIL limits CPU-bound work to 1 core):
def cpu_task():
    total = sum(i for i in range(10000000))

t1 = threading.Thread(target=cpu_task)
t2 = threading.Thread(target=cpu_task)

# 2. Multiprocessing (Separate OS processes bypass GIL):
def proc_task(q):
    q.put(sum(i for i in range(10000000)))""",
      "inReality": """• The Global Interpreter Lock (GIL): CPython has a mutex preventing multiple OS threads from executing Python bytecode simultaneously. This prevents race conditions inside CPython's reference counter and C extension state.
• Threading Overhead: threading.Thread spawns real OS threads, but CPU-bound tasks suffer from thread contention over the GIL, often executing slower than single-threaded code!
• Multiprocessing Overhead: multiprocessing.Process forks separate OS processes to bypass the GIL. However, exchanging data requires pickling (serializing) objects through IPC sockets, which incurs heavy CPU and memory copying penalties.
• Python 3.13+ Free-Threading: PEP 703 introduces an experimental build without the GIL, using biased reference counting and mimalloc."""
    }
  },

  # -------------------------------------------------------------
  # 2. VARIABLES, TYPES & NULL SAFETY
  # -------------------------------------------------------------
  {
    "id": "typing-and-null-safety",
    "category": "Variables & Types",
    "title": "Sound Null Safety vs. Dynamic None",
    "tags": ["Types", "Null Safety", "None", "Compilation"],
    "summary": "How the compiler and runtime handle empty/null values and eliminate null pointer exceptions.",
    "keyTakeaway": "Dart guarantees sound null safety at compile time (non-nullable types can never be null). Python relies on dynamic None checks at runtime.",
    "dartDoc": "https://dart.dev/null-safety/understanding-null-safety",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#none",
    "dart": {
      "code": """// Official Dart Sound Null Safety (dart.dev/null-safety):
String name = 'Alex';     // Non-nullable by default
// name = null;           // COMPILE ERROR! Code will not build.

String? optionalName;     // Nullable type explicitly marked with ?
optionalName = null;      // Allowed

// Null-aware operators:
int len = optionalName?.length ?? 0; // Safe call & fallback
String forced = optionalName!;       // Null assertion operator""",
      "inReality": """• Soundness Guarantee: If a variable is declared 'String name', the Dart compiler mathematically proves it will NEVER contain a null pointer (0x0).
• CPU Optimization: The AOT compiler eliminates null checks from emitted machine code for non-nullable variables. CPU branch prediction is not wasted checking for null pointers.
• Flow Analysis: If you write 'if (optionalName != null)', the compiler automatically promotes 'optionalName' to non-nullable 'String' within that scope without requiring a cast."""
    },
    "python": {
      "code": """# Python Data Model (docs.python.org/3/reference/datamodel.html#none)
name: str = "Alex"        # Type annotation (hint only, not enforced!)
name = None               # Valid Python! Allowed at runtime.

# Null-aware handling:
optional_name: str | None = None

# Manual fallback:
length = len(optional_name) if optional_name is not None else 0

# Gotcha with 'or': (optional_name or "default")
# treats empty string "" and 0 as falsy!""",
      "inReality": """• None is a Singleton Object: In Python, 'None' is an instance of 'NoneType' (Py_None pointer). Any variable in Python is an untyped pointer that can point to Py_None at any moment.
• Type Hints are Ignored: Writing ': str' is purely metadata stored in '__annotations__'. CPython never checks this at runtime. Calling 'name.upper()' when name is None raises 'AttributeError: NoneType object has no attribute upper'.
• External Tooling: Strict type safety requires running static analyzers like Mypy or Pyright in CI/CD."""
    }
  },
  {
    "id": "variable-declarations",
    "category": "Variables & Types",
    "title": "Variable Declarations: var, final, const vs. Dynamic Binding",
    "tags": ["Variables", "var", "final", "const", "Immutability"],
    "summary": "Declaration keywords, compile-time constants, and memory immutability.",
    "keyTakeaway": "Dart has typed var, runtime immutable final, and compile-time canonicalized const. Python binds names dynamically in namespaces.",
    "dartDoc": "https://dart.dev/language/variables",
    "pythonDoc": "https://docs.python.org/3/reference/executionmodel.html#naming-and-binding",
    "dart": {
      "code": """var a = 42;            // Type inferred as int (mutable)
a = 99;                // OK
// a = 'text';         // COMPILE ERROR: Cannot assign String to int

final DateTime now = DateTime.now(); // Runtime immutable (assigned once)

const double pi = 3.14159;           // Compile-time constant
const list1 = [1, 2, 3];
const list2 = [1, 2, 3];
print(identical(list1, list2));      // true! Exact same canonical memory address!""",
      "inReality": """• 'var': Type is inferred at compile time and permanently locked. Dart is strictly typed; 'var' is not dynamic.
• 'final': Can only be assigned once during runtime (e.g. in a constructor or at declaration).
• 'const': Evaluated at compile time. The compiler canonicalizes const objects into read-only memory sections. If identical const collections or objects exist across the app, they share the exact same memory pointer, saving heap allocations."""
    },
    "python": {
      "code": """a = 42                 # Name 'a' bound to int 42
a = "text"             # Re-bound to str object (valid)

from typing import Final
MAX_SIZE: Final = 100  # Type hint only
# MAX_SIZE = 200       # Python runs this fine without error!

# Immutability is an object property, not a variable property:
t1 = (1, 2, 3)         # Tuple is immutable
t2 = (1, 2, 3)
print(t1 is t2)        # May be True or False (CPython optimizer dependent)""",
      "inReality": """• Dynamic Name Binding: Variables in Python are simply string keys in the current namespace dictionary (locals() or globals()) mapping to PyObject pointers. Reassigning a variable modifies the hash table entry.
• Final is Non-Enforcing: typing.Final does not alter CPython execution; CPython allows re-binding at runtime unless protected by custom class descriptors.
• Interning: CPython pre-allocates small integers (-5 to 256) and interned string literals, but user objects are not automatically canonicalized like Dart's 'const'."""
    }
  },
  {
    "id": "type-checking-promotion",
    "category": "Variables & Types",
    "title": "Type Checking, Casting & Smart Promotion",
    "tags": ["Casting", "Type Check", "is", "as", "isinstance", "Promotion"],
    "summary": "Checking runtime types, type casting, and smart compiler flow analysis.",
    "keyTakeaway": "Dart automatically promotes types inside 'if (x is Type)' blocks. Python requires isinstance() and still uses dynamic dispatch.",
    "dartDoc": "https://dart.dev/language/type-system#type-promotion",
    "pythonDoc": "https://docs.python.org/3/library/functions.html#isinstance",
    "dart": {
      "code": """Object obj = 'Hello Dart';

// Type check with automatic Smart Promotion:
if (obj is String) {
  // Dart compiler AUTOMATICALLY promotes 'obj' to String:
  print(obj.length);   // Directly accessible! No manual cast needed.
}

// Explicit cast:
String str = obj as String; // Throws TypeError at runtime if invalid""",
      "inReality": """• 'is' Operator: Checks the runtime type against the interface table.
• Smart Type Promotion: Dart's flow analysis proves that inside the conditional block, 'obj' cannot change type, so it updates the AST type and compiles direct method calls to String methods.
• 'as' Operator: In checked mode, validates the type. If invalid, throws TypeError before attempting unsafe memory access."""
    },
    "python": {
      "code": """obj: object = "Hello Python"

# Type checking:
if isinstance(obj, str):
    # Python still performs dynamic attribute lookup at runtime:
    print(len(obj))

# Type casting in Python:
from typing import cast
s = cast(str, obj)     # cast() returns obj completely untouched!
# cast() is a runtime no-op: def cast(type_, val): return val""",
      "inReality": """• 'isinstance(obj, classinfo)' walks the object's __class__.__mro__ tuple to verify inheritance.
• Dynamic Dispatch: Even inside the 'isinstance' check, Python resolves methods dynamically through dictionary lookups on every single call.
• typing.cast: Does nothing at runtime. It exists solely to silence warnings in static type checkers like Mypy."""
    }
  },

  # -------------------------------------------------------------
  # 3. PRIMITIVES, NUMBERS & STRINGS
  # -------------------------------------------------------------
  {
    "id": "numbers-and-precision",
    "category": "Primitives & Strings",
    "title": "Numbers: Fixed 64-bit vs. Arbitrary Precision",
    "tags": ["int", "double", "float", "Math", "Overflow"],
    "summary": "How numbers are stored in memory registers and handled during arithmetic overflow.",
    "keyTakeaway": "Dart uses native unboxed 64-bit signed ints and IEEE 754 doubles. Python integers have arbitrary precision and never overflow.",
    "dartDoc": "https://dart.dev/language/built-in-types#numbers",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#numbers-number",
    "dart": {
      "code": """int maxVal = 9223372036854775807; // Maximum 64-bit signed int
int wrapped = maxVal + 1;         // Wraps around to -9223372036854775808 (Native 64-bit)

double d = 3.14;                  // IEEE-754 64-bit double precision
int intDiv = 7 ~/ 2;              // Truncating integer division (~/): 3
double trueDiv = 7 / 2;           // Standard division (/): 3.5""",
      "inReality": """• Unboxed 64-Bit Integers: In native AOT mode, Dart integers map directly to CPU registers (or SMI - Small Integer with tag bit). Arithmetic uses single native CPU instructions (ADD, SUB, IMUL).
• Integer Overflow: Overflows wrap around according to standard two's complement arithmetic without throwing exceptions.
• Web Target: When compiling to JavaScript (dart2js), ints map to JS numbers (double precision, safe up to 2^53 - 1). With dart2wasm, ints map to true 64-bit Wasm i64."""
    },
    "python": {
      "code": """max_val = 9223372036854775807      # 64-bit max int
wrapped = max_val + 1             # 9223372036854775808 (GROWS ARBITRARILY!)
huge = 10 ** 100                  # 100-digit number handled effortlessly

d = 3.14                          # 64-bit C double
int_div = 7 // 2                  # Floor division (//): 3
true_div = 7 / 2                  # True division (/): 3.5""",
      "inReality": """• Arbitrary-Precision Bignums: Python's 'int' is a C structure (PyLongObject) containing an array of 30-bit digits. It grows dynamically to fit numbers of any size until system RAM is exhausted.
• No Overflow: Python integers will never overflow.
• Memory Overhead: A simple integer like '42' consumes 28 bytes of heap memory in CPython on a 64-bit architecture (ob_refcnt + ob_type + ob_size + digit), compared to 8 bytes or 0 bytes (in register) in Dart."""
    }
  },
  {
    "id": "strings-and-interpolation",
    "category": "Primitives & Strings",
    "title": "Strings, UTF Encoding & Interpolation",
    "tags": ["String", "Interpolation", "UTF-16", "Unicode", "f-strings"],
    "summary": "Internal string memory representation and string interpolation mechanisms.",
    "keyTakeaway": "Dart strings are UTF-16 code units with $var interpolation. Python strings use PEP 393 flexible representations (1, 2, or 4 bytes/char) with f-strings.",
    "dartDoc": "https://dart.dev/language/built-in-types#strings",
    "pythonDoc": "https://docs.python.org/3/reference/lexical_analysis.html#formatted-string-literals",
    "dart": {
      "code": """String name = 'Alice';
int age = 30;

// String interpolation with $ and ${}:
String msg = 'Name: $name, Next Year: ${age + 1}';

// Multiline and Raw strings:
String multi = '''
  Line 1
  Line 2
''';
String raw = r'C:\\Users\\name\\path'; // Ignores escape characters""",
      "inReality": """• UTF-16 Encoding: Dart strings are sequences of 16-bit code units. Characters outside the Basic Multilingual Plane (such as emojis 🚀) are represented as surrogate pairs.
• Optimization: The Dart compiler translates string interpolation into StringBuffer concatenation or optimized internal string builders at compile time.
• Runes: To access actual Unicode 32-bit code points instead of 16-bit code units, Dart provides the 'string.runes' iterable."""
    },
    "python": {
      "code": """name = "Alice"
age = 30

# f-string interpolation (PEP 498):
msg = f"Name: {name}, Next Year: {age + 1}"

# Multiline and Raw strings:
multi = \"\"\"
  Line 1
  Line 2
\"\"\"
raw = r"C:\\Users\\name\\path"  # Ignores escape characters""",
      "inReality": """• PEP 393 Flexible Representation: Python strings are stored as Latin-1 (1 byte/char), UCS-2 (2 bytes/char), or UCS-4 (4 bytes/char) based on the highest Unicode code point in the string. If a string contains a single emoji, Python automatically expands the entire string to 4 bytes per character.
• f-strings: Compiled into specialized BUILD_STRING opcodes or FORMAT_VALUE bytecode instructions, evaluating expressions directly inside the local frame.
• Indexing: Python len(s) and s[i] always count actual Unicode codepoints, never surrogate code units."""
    }
  },
  {
    "id": "booleans-and-truthiness",
    "category": "Primitives & Strings",
    "title": "Booleans & Truthiness Evaluation",
    "tags": ["bool", "Truthiness", "Type Safety", "Conditionals"],
    "summary": "How conditional statements evaluate boolean expressions and implicit conversions.",
    "keyTakeaway": "Dart enforces strict boolean evaluation (only true is true). Python supports implicit truthiness (empty collections, 0, None are falsy).",
    "dartDoc": "https://dart.dev/language/built-in-types#booleans",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#basic-customization",
    "dart": {
      "code": """bool isValid = true;

if (isValid) {
  print('Valid');
}

// THE FOLLOWING ARE COMPILE-TIME ERRORS IN DART:
// if (1) { ... }         // Error: Conditions must have type 'bool'
// if ('text') { ... }    // Error: Conditions must have type 'bool'
// if (list.length) { ...}// Error: Conditions must have type 'bool'

// Explicit boolean condition required:
List<String> items = [];
if (items.isNotEmpty) {
  print('Has items');
}""",
      "inReality": """• Strict Boolean Type: Dart requires conditions in 'if', 'while', and ternary operators to evaluate strictly to the static type 'bool'.
• No Hidden Type Coercion: Integers, empty strings, and null are NOT implicitly coerced to false. This prevents insidious JavaScript-style and Python-style falsy bugs (such as treating 0 or empty string as non-existent)."""
    },
    "python": {
      "code": """# Implicit truthiness evaluation:
items = []
if not items:            # Empty list evaluates to False!
    print("List is empty")

count = 0
if not count:            # 0 evaluates to False!
    print("Count is zero")

text = ""
if not text:             # Empty string evaluates to False!
    print("Empty string")

# Objects implement truthiness via __bool__ or __len__:
class Custom:
    def __bool__(self):
        return False""",
      "inReality": """• __bool__ and __len__ Protocol: When evaluating 'if x:', Python calls x.__bool__(). If __bool__ is not defined, it calls x.__len__() (returning False if 0). If neither is defined, the object is considered True.
• Gotcha: Writing 'if val:' to check whether a variable was supplied fails if the caller passes 0, False, or "", because all three evaluate to False! Developers must explicitly write 'if val is not None:'."""
    }
  },

  # -------------------------------------------------------------
  # 4. COLLECTIONS & DATA STRUCTURES
  # -------------------------------------------------------------
  {
    "id": "lists-and-arrays",
    "category": "Collections",
    "title": "Lists / Arrays & Memory Buffers",
    "tags": ["List", "Array", "Memory", "Spread", "Collection-if"],
    "summary": "Sequential storage, memory layouts, collection-if/for, and comprehensions.",
    "keyTakeaway": "Dart List<T> is a typed contiguous array buffer. Python list is an array of pointers to arbitrary heap PyObjects.",
    "dartDoc": "https://dart.dev/language/collections#lists",
    "pythonDoc": "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists",
    "dart": {
      "code": """// Typed contiguous list (dart.dev/language/collections)
List<int> numbers = [1, 2, 3, 4];
numbers.add(5);

// Collection-if, Collection-for, and Spread operator:
bool hasAdmin = true;
var userList = [
  'Alice',
  'Bob',
  if (hasAdmin) 'SuperAdmin',
  for (var i = 1; i <= 3; i++) 'Guest_$i',
  ...numbers.map((n) => 'User_$n'),
];""",
      "inReality": """• Contiguous Memory: List<int> allocates a contiguous array buffer. In native AOT, iterating over a typed list compiles to direct indexed pointer arithmetic.
• Growth Policy: Resizable lists allocate internal capacity in chunks (geometric growth factor ~1.5x to 2x).
• Collection-if and Collection-for: Processed natively during list literal construction without allocating intermediate lists or invoking generator comprehensions."""
    },
    "python": {
      "code": """# Heterogeneous dynamic array of pointers:
numbers = [1, 2, 3, 4]
numbers.append(5)

# Python list comprehension & unpacking:
has_admin = True
user_list = [
    "Alice",
    "Bob",
    *(["SuperAdmin"] if has_admin else []),
    *[f"Guest_{i}" for i in range(1, 4)],
    *[f"User_{n}" for n in numbers],
]

# Slicing creates a new shallow copy:
sub = numbers[1:3]  # [2, 3]""",
      "inReality": """• Array of Pointers: A Python list is a PyListObject containing 'ob_item', which is a C array of pointers (PyObject**) pointing to objects scattered across the heap.
• Slicing copies: 'numbers[1:3]' allocates a completely new PyListObject and copies pointers. In Dart, sublist() copies, but view operations can be done via skip/take.
• Heterogeneity: A Python list can store [1, "two", 3.0, [4]] because every element is simply an 8-byte pointer, incurring cache misses when iterating through numerical data."""
    }
  },
  {
    "id": "maps-and-dictionaries",
    "category": "Collections",
    "title": "Maps vs. Dictionaries (Hash Tables)",
    "tags": ["Map", "Dictionary", "Hash Table", "Key-Value"],
    "summary": "Key-value mapping implementations, hash codes, and missing key behaviors.",
    "keyTakeaway": "Dart Map<K,V> maintains insertion order and returns null on missing keys. Python dict uses a compact hash table and raises KeyError on missing keys.",
    "dartDoc": "https://dart.dev/language/collections#maps",
    "pythonDoc": "https://docs.python.org/3/tutorial/datastructures.html#dictionaries",
    "dart": {
      "code": """Map<String, int> scores = {
  'Alice': 95,
  'Bob': 88,
};

scores['Charlie'] = 92;
int? bobScore = scores['Bob']; // Returns nullable int? (null if missing)
int? missing = scores['Ghost']; // null (O(1), no exception thrown)

// Iterating over key-value pairs:
for (var entry in scores.entries) {
  print('${entry.key}: ${entry.value}');
}""",
      "inReality": """• LinkedHashMap: Map literals in Dart create a LinkedHashMap which preserves insertion order via a linked bucket table.
• Equality: Keys rely on Object.hashCode and operator==. If two keys have identical hash codes and are equal, they map to the same bucket.
• Null on missing: Accessing scores['Missing'] returns null in O(1) time without throwing an exception."""
    },
    "python": {
      "code": """scores: dict[str, int] = {
    "Alice": 95,
    "Bob": 88,
}

scores["Charlie"] = 92
bob_score = scores.get("Bob")   # Returns None if missing
# missing = scores["Ghost"]     # THROWS KeyError!

# Iterating:
for key, value in scores.items():
    print(f"{key}: {value}")""",
      "inReality": """• Compact Hash Table (Raymond Hettinger design): Since Python 3.6+, dict uses two arrays: a sparse hash indices array and a dense entries array storing (hash, key_ptr, value_ptr). This saves ~30-40% memory and preserves insertion order natively.
• Missing keys throw: 'scores["Unknown"]' immediately raises a KeyError. Developers must use scores.get("key", default) or collections.defaultdict.
• __hash__ and __eq__: Keys must be hashable (immutable objects like strings, ints, tuples). Mutable types like lists or dicts raise TypeError: unhashable type."""
    }
  },
  {
    "id": "records-and-tuples",
    "category": "Collections",
    "title": "Records vs. Tuples (Multiple Return Values)",
    "tags": ["Records", "Tuples", "Destructuring", "Pattern Matching"],
    "summary": "Anonymous, immutable aggregate data structures for grouping values.",
    "keyTakeaway": "Dart 3 Records support positional and named typed fields with potential register unboxing. Python tuples are positional-only immutable sequences.",
    "dartDoc": "https://dart.dev/language/records",
    "pythonDoc": "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences",
    "dart": {
      "code": """// Official Dart 3 Records (dart.dev/language/records):
(String, int, {bool isAdmin}) getUser() {
  return ('Alice', 30, isAdmin: true);
}

void main() {
  final user = getUser();
  print(user.$1);       // Positional field 1: Alice
  print(user.$2);       // Positional field 2: 30
  print(user.isAdmin);  // Named field: true

  // Destructuring:
  var (name, age, isAdmin: admin) = getUser();
}""",
      "inReality": """• Dart 3 Records are strongly typed, immutable aggregate types.
• Value Equality: Records have automatic structural value equality (two records with identical fields are operator==).
• Compiler Inlining: The Dart AOT compiler can unbox records across function boundaries, returning multiple values directly across CPU registers without allocating any heap object!"""
    },
    "python": {
      "code": """def get_user() -> tuple[str, int, bool]:
    return "Alice", 30, True  # Returns a tuple object

user = get_user()
print(user[0])       # Alice
print(user[1])       # 30

# Unpacking:
name, age, is_admin = get_user()

# NamedTuple for named fields:
from typing import NamedTuple
class User(NamedTuple):
    name: str
    age: int
    is_admin: bool""",
      "inReality": """• PyTupleObject is an immutable C array of object pointers on the heap.
• Immutability: Once created, the tuple cannot be resized or modified, but if it contains mutable objects (like a list), those objects can still mutate.
• Allocation: Small tuples are pooled by CPython to reduce allocator churn, but returning a tuple always passes a pointer to the PyTupleObject structure."""
    }
  },

  # -------------------------------------------------------------
  # 5. CONTROL FLOW & PATTERN MATCHING
  # -------------------------------------------------------------
  {
    "id": "pattern-matching-switch",
    "category": "Control Flow",
    "title": "Pattern Matching & Switch Expressions",
    "tags": ["Switch", "Match", "Pattern Matching", "Control Flow"],
    "summary": "Advanced structural pattern matching, destructuring, and compile-time exhaustiveness.",
    "keyTakeaway": "Dart 3 switch expressions enforce compile-time exhaustiveness. Python 3.10+ match-case evaluates patterns sequentially at runtime.",
    "dartDoc": "https://dart.dev/language/patterns",
    "pythonDoc": "https://docs.python.org/3/reference/compound_stmts.html#the-match-statement",
    "dart": {
      "code": """sealed class Shape {}
class Circle extends Shape { final double radius; Circle(this.radius); }
class Square extends Shape { final double side; Square(this.side); }

// Exhaustive switch expression (dart.dev/language/branches#switch-expressions):
double getArea(Shape shape) => switch (shape) {
  Circle(radius: var r) => 3.14159 * r * r,
  Square(side: var s)   => s * s,
  // Compile error if any subtype is missing!
};

// Relational pattern matching:
String grade(int score) => switch (score) {
  >= 90 => 'A',
  >= 80 and < 90 => 'B',
  _ => 'F',
};""",
      "inReality": """• Compile-time Exhaustiveness: When switching over a sealed class hierarchy or enum, the Dart compiler validates that every possible case is handled. Omitting a case causes a compilation error before code ever runs.
• Code Generation: Dart compiles switch expressions down to jump tables or optimized conditional branch instructions directly in assembly.
• Destructuring & Binding: Extracting fields occurs safely with automatic type inference and smart casting."""
    },
    "python": {
      "code": """from dataclasses import dataclass

@dataclass
class Circle:
    radius: float

@dataclass
class Square:
    side: float

Shape = Circle | Square

# Python 3.10+ Structural Pattern Matching (PEP 634):
def get_area(shape: Shape) -> float:
    match shape:
        case Circle(radius=r):
            return 3.14159 * r * r
        case Square(side=s):
            return s * s
        case _:
            raise ValueError("Unknown shape")

def grade(score: int) -> str:
    match score:
        case s if s >= 90:
            return "A"
        case s if 80 <= s < 90:
            return "B"
        case _:
            return "F" """,
      "inReality": """• Runtime Evaluation: Python's 'match' evaluates cases sequentially at runtime. In 'case Circle(radius=r)', it checks isinstance(shape, Circle), inspects '__match_args__', and extracts the attribute dynamically.
• No Native Exhaustiveness Check: CPython does not enforce that all union variants are handled. If no case matches and there is no 'case _', execution simply falls through to the next statement returning None (unless external type checkers like mypy/pyright detect missing cases)."""
    }
  },
  {
    "id": "loops-and-comprehensions",
    "category": "Control Flow",
    "title": "Loops, Iteration & Comprehensions",
    "tags": ["Loops", "for-in", "Comprehension", "while", "Labels"],
    "summary": "Iterating collections, transforming elements, and loop control statements.",
    "keyTakeaway": "Dart uses for/while loops, collection-for/map, and labeled breaks. Python leverages list/dict/set comprehensions and 'for-else' constructs.",
    "dartDoc": "https://dart.dev/language/loops",
    "pythonDoc": "https://docs.python.org/3/tutorial/controlflow.html#for-statements",
    "dart": {
      "code": """final list = [1, 2, 3, 4, 5];

// For-in loop:
for (final item in list) {
  if (item == 3) continue;
}

// Functional pipeline:
final doubled = list.where((n) => n.isEven).map((n) => n * 2).toList();

// Labeled loops (Unique to C/Dart family):
outerLoop:
for (var i = 0; i < 3; i++) {
  for (var j = 0; j < 3; j++) {
    if (i == 1 && j == 1) break outerLoop; // Exits outer loop!
  }
}""",
      "inReality": """• Iterable Pipeline: 'where' and 'map' create lazy Iterable adapters. They do not allocate memory for transformed items until .toList() or iteration pulls the values.
• Loop Labels: Dart supports goto-style loop labels ('break label;'), compiling directly to unconditional jump assembly instructions (JMP), which Python does not support natively."""
    },
    "python": {
      "code": """items = [1, 2, 3, 4, 5]

# Standard iteration:
for item in items:
    if item == 3:
        continue

# List Comprehension (Idiomatic Python):
doubled = [n * 2 for n in items if n % 2 == 0]

# For-Else construct (Runs 'else' if loop finishes without break):
for n in items:
    if n == 99:
        break
else:
    print("99 was not found in the list!")""",
      "inReality": """• List Comprehensions: Executed in specialized frame bytecode (LIST_APPEND opcode) which is significantly faster in CPython than a standard for-loop with list.append().
• For-Else: Unique to Python; the 'else' block executes only if the loop terminates normally (without encountering a 'break' statement).
• Breaking Outer Loops: Python does not support labeled breaks. Developers must raise exceptions, set flag variables, or refactor nested loops into helper functions with 'return'."""
    }
  },

  # -------------------------------------------------------------
  # 6. FUNCTIONS, CLOSURES & SCOPE
  # -------------------------------------------------------------
  {
    "id": "function-parameters",
    "category": "Functions & Scope",
    "title": "Positional, Named & Optional Parameters",
    "tags": ["Functions", "Parameters", "Named Arguments", "Default Values"],
    "summary": "How function arguments are declared, passed, and validated.",
    "keyTakeaway": "Dart uses explicit syntax for named curly-bracket params and optional square-bracket params. Python uses positional/keyword syntax with *args and **kwargs.",
    "dartDoc": "https://dart.dev/language/functions#parameters",
    "pythonDoc": "https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions",
    "dart": {
      "code": """// Named parameters with {}:
void createUser({
  required String name,
  int age = 18,
  String? role,
}) {
  print('$name, $age, $role');
}

// Optional positional parameters with []:
void log(String msg, [String prefix = 'INFO', int code = 0]) {
  print('[$prefix] $msg ($code)');
}

void main() {
  createUser(name: 'Alice', role: 'Admin'); // Order does not matter for named!
  log('System reboot');                     // Uses default arguments
}""",
      "inReality": """• Compile-time Argument Verification: In Dart, calling createUser(name: 'Alice') ensures at compile-time that 'name' is supplied. The compiler validates argument names and types at build time.
• Argument Passing: Named parameters are mapped to exact argument slots at compile time without dictionary lookups.
• Mutual Exclusivity: A Dart function cannot mix optional positional [b] and named {c} in the same signature; you choose either positional optional or named optional."""
    },
    "python": {
      "code": """# Positional-only (/), keyword-only (*), and defaults:
def create_user(
    name: str,
    *,                  # Everything after * MUST be passed as keyword!
    age: int = 18,
    role: str | None = None
) -> None:
    print(f"{name}, {age}, {role}")

# Arbitrary arguments (*args, **kwargs):
def flexible_func(*args, **kwargs):
    print("Positional:", args)     # tuple
    print("Keywords:", kwargs)     # dict

create_user("Alice", role="Admin")
flexible_func(1, 2, mode="fast")""",
      "inReality": """• Dict Unpacking: Python keyword arguments (**kwargs) allocate a new dict object on every call to receive unmapped keyword parameters.
• Keyword-Only Enforcer (*): The CPython interpreter validates keyword-only constraints at runtime during CALL opcodes.
• Mutable Default Argument Gotcha: In Python, 'def f(lst=[])' initializes the list ONCE when the module loads. Mutating 'lst' mutates it across all subsequent calls! Dart does not suffer from this because default values must be compile-time constants (const)."""
    }
  },
  {
    "id": "lambdas-and-closures",
    "category": "Functions & Scope",
    "title": "Lambdas, Arrow Functions & Closures",
    "tags": ["Lambdas", "Closures", "Arrow Functions", "Scope"],
    "summary": "Anonymous functions, lexical scope captures, and multi-line closures.",
    "keyTakeaway": "Dart supports full multi-line anonymous functions and arrow expressions. Python restricts lambdas strictly to single expressions.",
    "dartDoc": "https://dart.dev/language/functions#anonymous-functions",
    "pythonDoc": "https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions",
    "dart": {
      "code": """// Arrow syntax (single expression):
final add = (int a, int b) => a + b;

// Multi-line anonymous function:
final process = (String input) {
  final trimmed = input.trim();
  final upper = trimmed.toUpperCase();
  return '$upper!';
};

// Lexical closure capturing variable:
Function makeAdder(int delta) {
  return (int value) => value + delta; // Captures 'delta'
}

// Tear-off (Direct method reference):
final list = ['apple', 'banana'];
list.forEach(print); // Tear-off replaces (x) => print(x)""",
      "inReality": """• Dart Closures: When an inner function references an outer variable ('delta'), the Dart compiler allocates a context heap object storing the captured variable, preserving it after the outer function frame returns.
• Tear-Offs: Passing 'print' or 'object.method' generates a callable tear-off object with zero boilerplate, optimized by the VM.
• No Syntax Limits: Dart anonymous functions can have arbitrary complexity, control flow, loops, try-catch blocks, and type declarations."""
    },
    "python": {
      "code": """# Python lambda: STRICTLY limited to a single expression!
add = lambda a, b: a + b

# Multi-line logic REQUIRES a named nested function:
def process(text: str) -> str:
    trimmed = text.strip()
    upper = trimmed.upper()
    return f"{upper}!"

# Closure:
def make_adder(delta: int):
    def adder(value: int):
        return value + delta  # Captures 'delta' in __closure__
    return adder

# Function references:
list_items = ["apple", "banana"]
list(map(print, list_items))""",
      "inReality": """• Single-expression limitation: Python's 'lambda' syntax intentionally forbids statements (no assignments, no if-else statements unless ternary, no loops, no try-catch). For anything beyond one expression, 'def' must be used.
• Cell Objects: Closures in Python store captured variables in '__closure__', a tuple of 'cell' objects that point to the shared variables.
• Late Binding Gotcha: In Python, closures capture variables by reference, not value. Creating lambdas in a loop like '[lambda: i for i in range(3)]' causes all lambdas to return 2! Dart binds fresh loop variables per iteration, preventing this bug."""
    }
  },
  {
    "id": "generators-and-yield",
    "category": "Functions & Scope",
    "title": "Generators: sync* / async* vs. yield",
    "tags": ["Generators", "yield", "Iterables", "async*", "sync*"],
    "summary": "Lazy sequence generation and reactive event streaming.",
    "keyTakeaway": "Dart distinguishes synchronous generators (sync* -> Iterable) and async stream generators (async* -> Stream). Python uses yield for both.",
    "dartDoc": "https://dart.dev/language/functions#generators",
    "pythonDoc": "https://docs.python.org/3/reference/expressions.html#yield-expressions",
    "dart": {
      "code": """// Synchronous generator (Returns lazy Iterable<int>):
Iterable<int> countUpTo(int max) sync* {
  for (int i = 1; i <= max; i++) {
    yield i; // Yields one item at a time
  }
}

// Asynchronous generator (Returns reactive Stream<int>):
Stream<int> periodicStream(int max) async* {
  for (int i = 1; i <= max; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i; // Yields event over time
  }
}""",
      "inReality": """• sync*: The Dart compiler creates an iterator state machine. Execution pauses at each 'yield' until the consumer calls 'moveNext()'.
• async*: Generates a Dart 'Stream'. Pushes events to listeners reactively with built-in backpressure handling and pause/resume capabilities.
• yield*: Dart uses 'yield* otherIterable;' to delegate to nested generators efficiently without stack accumulation."""
    },
    "python": {
      "code": """import asyncio
from typing import Iterator, AsyncIterator

# Synchronous generator:
def count_up_to(max_val: int) -> Iterator[int]:
    for i in range(1, max_val + 1):
        yield i

# Asynchronous generator:
async def periodic_stream(max_val: int) -> AsyncIterator[int]:
    for i in range(1, max_val + 1):
        await asyncio.sleep(1)
        yield i

# Delegating to subgenerator:
def combined():
    yield from count_up_to(5) # 'yield from' delegates directly""",
      "inReality": """• Frame Suspension: In CPython, a generator function returns a PyGenObject. Calling next() resumes execution by restoring the suspended frame's instruction pointer (f_lasti) on the C stack.
• Asynchronous Generators: 'async def' with 'yield' creates a PyAsyncGenObject, consumed via 'async for' by driving the async event loop.
• yield from: Establishes a transparent bidirectional communication channel between caller and subgenerator, propagating values, exceptions, and returns."""
    }
  },

  # -------------------------------------------------------------
  # 7. OBJECT-ORIENTED PROGRAMMING
  # -------------------------------------------------------------
  {
    "id": "classes-and-constructors",
    "category": "Object-Oriented Programming",
    "title": "Classes, Constructors & Initialization",
    "tags": ["OOP", "Classes", "Constructors", "__init__", "Factory"],
    "summary": "Object creation, initialization lists, named constructors, and factory patterns.",
    "keyTakeaway": "Dart features named, const, and factory constructors with initializing formals. Python uses __new__ for allocation and __init__ for initialization.",
    "dartDoc": "https://dart.dev/language/constructors",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#basic-customization",
    "dart": {
      "code": """class User {
  final String name;
  final int age;

  // Initializing formals (this.name binds field directly):
  User(this.name, this.age);

  // Named Constructor:
  User.guest() : name = 'Guest', age = 0; // Initializer list

  // Factory Constructor (Can return cached or subtype instances):
  static final Map<String, User> _cache = {};
  factory User.cached(String name, int age) {
    return _cache.putIfAbsent(name, () => User(name, age));
  }
}""",
      "inReality": """• Initializer Lists: In Dart, initializer lists run BEFORE the constructor body and superclass constructor. This allows 'final' non-nullable fields to be assigned before the instance is even fully formed.
• Factory Constructors: Unlike normal constructors that always allocate a fresh instance of the class, a Dart factory constructor can decide whether to return a new object, fetch an existing instance from a cache, or instantiate a subclass.
• Named Constructors: Eliminates method overloading ambiguities (e.g. User.fromJson(json), User.fromDb(row))."""
    },
    "python": {
      "code": """class User:
    _cache: dict[str, "User"] = {}

    # __new__ controls allocation:
    def __new__(cls, name: str, age: int = 18):
        if name in cls._cache:
            return cls._cache[name]
        instance = super().__new__(cls)
        cls._cache[name] = instance
        return instance

    # __init__ controls initialization:
    def __init__(self, name: str, age: int = 18):
        self.name = name
        self.age = age

    # Class method as alternative constructor:
    @classmethod
    def guest(cls) -> "User":
        return cls("Guest", 0)""",
      "inReality": """• Two-Stage Creation: Python splits instantiation into '__new__(cls)' (which allocates the raw PyObject in heap memory) and '__init__(self)' (which populates the instance dictionary __dict__).
• Dynamic Attribute Attachment: 'self.name = name' executes a hash table insertion into self.__dict__["name"].
• @classmethod for Named Constructors: Python does not have native named constructor syntax; idiomatic Python uses class methods decorated with @classmethod to return configured instances."""
    }
  },
  {
    "id": "visibility-and-properties",
    "category": "Object-Oriented Programming",
    "title": "Encapsulation: Privacy, Getters & Setters",
    "tags": ["Privacy", "Encapsulation", "Getters", "Setters", "@property"],
    "summary": "Data protection, library-level vs class-level privacy, and computed properties.",
    "keyTakeaway": "Dart uses leading underscore '_' for library-level privacy. Python uses convention (_private) or name mangling (__private) and @property.",
    "dartDoc": "https://dart.dev/language/classes#methods",
    "pythonDoc": "https://docs.python.org/3/tutorial/classes.html#private-variables",
    "dart": {
      "code": """class BankAccount {
  // Leading underscore makes field LIBRARY-PRIVATE:
  double _balance = 0.0;

  // Custom Getter:
  double get balance => _balance;

  // Custom Setter with validation:
  set balance(double value) {
    if (value >= 0) _balance = value;
  }
}

void main() {
  final account = BankAccount();
  account.balance = 150.0; // Calls setter transparently
  print(account.balance);  // Calls getter
  // account._balance is inaccessible outside this library file!
}""",
      "inReality": """• Library-level Privacy: In Dart, privacy is enforced at the LIBRARY (file/package) boundary, not the class boundary. Classes in the same Dart file can access each other's '_private' fields, but other files cannot.
• Field Uniformity: In Dart, replacing a public variable 'int x' with custom 'get x' and 'set x' requires ZERO changes in consumer code (Uniform Access Principle).
• Virtual Method Table: Getters and setters compile directly to method entries in the class vtable."""
    },
    "python": {
      "code": """class BankAccount:
    def __init__(self):
        self._balance = 0.0      # Convention: Protected (still accessible!)
        self.__secret_id = "123" # Name Mangling: becomes _BankAccount__secret_id

    @property
    def balance(self) -> float:
        return self._balance

    @balance.setter
    def balance(self, value: float) -> None:
        if value >= 0:
            self._balance = value

account = BankAccount()
account.balance = 150.0   # Invokes setter descriptor
print(account.balance)    # Invokes getter descriptor
# account._balance is still accessible (Python has no true privacy!)""",
      "inReality": """• No True Private Fields: Python has no language-enforced access modifiers. A single underscore '_var' is strictly a developer convention.
• Name Mangling: Double underscore '__var' mangles the attribute name to '_ClassName__var' in the instance dictionary to avoid accidental collisions in subclasses, but it is still accessible if referenced by its mangled name.
• Descriptors: The '@property' decorator implements Python's Descriptor Protocol (__get__, __set__), intercepting attribute lookups via the type dict."""
    }
  },
  {
    "id": "inheritance-mixins-interfaces",
    "category": "Object-Oriented Programming",
    "title": "Inheritance, Mixins vs. Multiple Inheritance",
    "tags": ["Inheritance", "Mixins", "MRO", "Interfaces", "Polymorphism"],
    "summary": "Code reuse strategies: single inheritance + mixins vs multiple inheritance with MRO.",
    "keyTakeaway": "Dart enforces single inheritance with mixins ('with') and implicit interfaces ('implements'). Python supports multiple inheritance with C3 Linearization (MRO).",
    "dartDoc": "https://dart.dev/language/mixins",
    "pythonDoc": "https://docs.python.org/3/tutorial/classes.html#multiple-inheritance",
    "dart": {
      "code": """abstract class Animal {
  void breathe();
}

// Mixins for reusable behavior without inheritance:
mixin Flyer {
  void fly() => print('Flying in sky');
}

mixin Swimmer {
  void swim() => print('Swimming in water');
}

// Every Dart class is also implicitly an interface!
class Duck extends Animal with Flyer, Swimmer {
  @override
  void breathe() => print('Duck breathing');
}

void main() {
  final d = Duck();
  d.fly();
  d.swim();
}""",
      "inReality": """• Single Inheritance: A Dart class can only extend ONE superclass (preventing the fragile base class / diamond problem).
• Mixins: Mixins create a linear composition chain at compile time. 'Duck' inherits from a synthesized intermediate class created by applying Flyer, which inherits from Animal.
• Implicit Interfaces: In Dart, EVERY class implicitly defines an interface. You can write 'class MockUser implements User' without having to declare an explicit abstract interface."""
    },
    "python": {
      "code": """from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def breathe(self):
        pass

class Flyer:
    def fly(self):
        print("Flying in sky")

class Swimmer:
    def swim(self):
        print("Swimming in water")

# Multiple Inheritance:
class Duck(Animal, Flyer, Swimmer):
    def breathe(self):
        print("Duck breathing")

d = Duck()
d.fly()
print(Duck.__mro__) # Displays Method Resolution Order""",
      "inReality": """• Multiple Inheritance: Python classes can inherit directly from multiple base classes.
• C3 Linearization (MRO): When resolving attributes or calling super(), Python traverses the Method Resolution Order (__mro__) calculated via the C3 linearization algorithm.
• Diamond Problem: If both parent classes define the same method, Python picks the one that appears first in the MRO. If the inheritance graph is mathematically inconsistent, Python raises TypeError: Cannot create a consistent method resolution order (MRO)."""
    }
  },

  # -------------------------------------------------------------
  # 8. ERROR HANDLING & EXCEPTIONS
  # -------------------------------------------------------------
  {
    "id": "exceptions-and-errors",
    "category": "Error Handling",
    "title": "Try-Catch-Finally vs. Try-Except-Else-Finally",
    "tags": ["Exceptions", "try-catch", "try-except", "rethrow", "finally"],
    "summary": "Catching specific errors, stack trace capture, and cleanup execution.",
    "keyTakeaway": "Dart uses 'on ExceptionType catch(e, s)' and 'rethrow'. Python uses 'except Exception as e', 'else' clause, and 'raise from'.",
    "dartDoc": "https://dart.dev/language/error-handling",
    "pythonDoc": "https://docs.python.org/3/tutorial/errors.html#handling-exceptions",
    "dart": {
      "code": """void performTask() {
  try {
    int result = 12 ~/ 0; // Integer division by zero
  } on UnsupportedError catch (e, stackTrace) {
    // Catch specific type with 'on'
    print('Caught specific error: $e');
    print('Stack trace: $stackTrace');
  } on Exception catch (e) {
    print('Caught general exception: $e');
  } catch (e) {
    // Catch anything else and rethrow:
    print('Unknown error: $e');
    rethrow; // Preserves original stack trace
  } finally {
    print('Cleanup runs unconditionally');
  }
}""",
      "inReality": """• Exceptions vs Errors: In Dart, 'Exception' represents recoverable conditions intended to be caught. 'Error' (like RangeError, OutOfMemoryError, StateError) represents programmer bugs that typically should not be caught.
• Any Object Can Be Thrown: In Dart, you can throw literally any non-null object ('throw 42;' or 'throw "Error";').
• 'rethrow': Re-propagates the active exception while preserving the original call stack trace intact without resetting the frame pointer."""
    },
    "python": {
      "code": """def perform_task():
    try:
        result = 12 // 0
    except ZeroDivisionError as e:
        print(f"Caught specific error: {e}")
    except Exception as e:
        print(f"Caught general exception: {e}")
    else:
        # Runs ONLY if NO exception was raised in try!
        print("Success! No exceptions were thrown.")
    finally:
        print("Cleanup runs unconditionally")

# Raising with context:
# raise RuntimeError("Task failed") from e""",
      "inReality": """• 'else' Block: Python uniquely features an 'else' block in try-except. Code in 'else' executes only if the 'try' block completed without raising any exception, avoiding accidental catching of exceptions from secondary code.
• BaseException Hierarchy: All exceptions must inherit from BaseException (typically Exception). Throwing arbitrary objects like 'raise 42' raises TypeError.
• Exception Chaining: 'raise NewException() from original_error' populates '__cause__' and '__context__', generating chained traceback reports in production logs."""
    }
  },

  # -------------------------------------------------------------
  # 9. ASYNCHRONOUS PROGRAMMING & CONCURRENCY
  # -------------------------------------------------------------
  {
    "id": "async-await-event-loop",
    "category": "Asynchronous Programming",
    "title": "Async/Await & The Event Loop",
    "tags": ["Async", "Await", "Future", "Event Loop", "Microtasks", "asyncio"],
    "summary": "Asynchronous scheduling, non-blocking I/O, Futures, and Coroutines.",
    "keyTakeaway": "Dart has a built-in two-queue event loop (Microtask vs Event Queue). Python relies on explicit event loop runtimes (asyncio).",
    "dartDoc": "https://dart.dev/language/async",
    "pythonDoc": "https://docs.python.org/3/library/asyncio-task.html",
    "dart": {
      "code": """Future<String> fetchData() async {
  await Future.delayed(Duration(milliseconds: 500));
  return 'Payload delivered';
}

void main() async {
  print('1. Start');

  // Microtask: High priority queue
  scheduleMicrotask(() => print('3. Microtask queue'));

  // Event queue: Standard async tasks
  fetchData().then((val) => print('4. $val'));

  print('2. End of sync main');
}""",
      "inReality": """• Two-Tier Event Loop: Dart's runtime continuously checks:
  1. Microtask Queue: Highest priority. Drained completely before the event queue. Used for internal state transitions.
  2. Event Queue: Handles I/O, timers, user taps, and isolate messages.
• Native to Language: Asynchrony is built directly into Dart's core runtime library (dart:async). You do not need to initialize an event loop manually.
• Futures: A Future<T> represents a computation that will produce a value or error in the future. Unhandled Future errors are routed to the Zone error handler."""
    },
    "python": {
      "code": """import asyncio

async def fetch_data() -> str:
    await asyncio.sleep(0.5)
    return "Payload delivered"

async def main():
    print("1. Start")
    task = asyncio.create_task(fetch_data())
    print("2. End of sync main")
    result = await task
    print(f"3. {result}")

# Must explicitly boot the event loop:
if __name__ == "__main__":
    asyncio.run(main())""",
      "inReality": """• Coroutine State Machines: In Python, calling an 'async def' function does NOT execute it; it returns a coroutine object. Execution only starts when scheduled on the loop via asyncio.run(), create_task(), or awaited.
• Generator Mechanics: Under the hood, Python coroutines rely on the generator frame suspension machinery (YIELD_VALUE opcode).
• Colored Function Problem: In Python, async functions cannot be awaited from synchronous code without driving the loop via run_until_complete(), causing a strict architectural split between async and sync code."""
    }
  },
  {
    "id": "streams-vs-async-iterators",
    "category": "Asynchronous Programming",
    "title": "Reactive Streams vs. Async Iterators",
    "tags": ["Streams", "AsyncIterator", "Reactive", "Events"],
    "summary": "Handling continuous streams of asynchronous events over time.",
    "keyTakeaway": "Dart Streams are first-class reactive event pipelines with transformation operators. Python uses AsyncIterators via 'async for'.",
    "dartDoc": "https://dart.dev/libraries/async/using-streams",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#asynchronous-iterators",
    "dart": {
      "code": """Stream<int> countStream() async* {
  for (int i = 1; i <= 3; i++) {
    await Future.delayed(Duration(milliseconds: 200));
    yield i;
  }
}

void main() async {
  // Consuming with 'await for':
  await for (final num in countStream()) {
    print('Received: $num');
  }

  // Reactive functional pipeline:
  countStream()
      .where((n) => n > 1)
      .map((n) => n * 10)
      .listen((val) => print('Stream pipeline: $val'));
}""",
      "inReality": """• Stream Controller: Dart Streams support Single-Subscription (default, sequential) and Broadcast (multi-listener) modes.
• Reactive Ecosystem: Dart streams natively power UI reactivity (StreamBuilder in Flutter, BLoC pattern, RxDart) with built-in pause, resume, cancel, and backpressure mechanisms.
• Listeners: Subscribing via .listen() registers an asynchronous callback on the event loop without blocking the surrounding code."""
    },
    "python": {
      "code": """import asyncio

async def count_stream():
    for i in range(1, 4):
        await asyncio.sleep(0.2)
        yield i

async def main():
    # Consuming with 'async for':
    async for num in count_stream():
        print(f"Received: {num}")

    # No built-in reactive stream operators in standard library!
    # Requires external libraries like RxPY or aiostream for .map()/.filter()

asyncio.run(main())""",
      "inReality": """• AsyncIterator Protocol: 'async for' calls the object's '__aiter__()' method and repeatedly awaits '__anext__()' until StopAsyncIteration is raised.
• Pull vs Push: Python's AsyncIterator is primarily a pull-based iteration mechanism. Dart Streams are push-based reactive emitters that can also be consumed via pull-style 'await for'."""
    }
  },

  # -------------------------------------------------------------
  # 10. METAPROGRAMMING, ECOSYSTEM & TOOLING
  # -------------------------------------------------------------
  {
    "id": "extension-methods",
    "category": "Metaprogramming & Tooling",
    "title": "Extension Methods vs. Monkey Patching",
    "tags": ["Extensions", "Monkey Patching", "Metaprogramming"],
    "summary": "Adding functionality to existing classes without modifying original source code.",
    "keyTakeaway": "Dart uses static extension methods (type-safe, zero runtime mutation). Python dynamically monkey-patches class dictionaries at runtime.",
    "dartDoc": "https://dart.dev/language/extension-methods",
    "pythonDoc": "https://docs.python.org/3/reference/datamodel.html#customizing-attribute-access",
    "dart": {
      "code": """// Dart Extension Method (Static resolution, dart.dev/language/extension-methods):
extension StringUtils on String {
  bool get isEmail => contains('@') && contains('.');
  String capitalize() => '${this[0].toUpperCase()}${substring(1)}';
}

void main() {
  String input = 'hello';
  print(input.capitalize()); // 'Hello'
  print('user@example.com'.isEmail); // true
}""",
      "inReality": """• Static Desugaring: Dart extension methods do NOT modify the underlying String class or its prototype/vtable.
• Zero Runtime Mutation: The compiler simply desugars 'input.capitalize()' into 'StringUtils(input).capitalize()'. If the extension is not imported in a file, it does not exist in that file.
• Tree-shaking Safe: Unused extension methods are completely removed during AOT compilation."""
    },
    "python": {
      "code": """# Python Monkey Patching (Dynamic mutation of class dictionary):
class MyService:
    def greet(self):
        return "Hello"

# Dynamically injecting a method at runtime:
def new_method(self):
    return "Dynamically injected!"

MyService.greet = new_method  # Mutates the class globally!

# Built-in types (str, int, list) CANNOT be monkey-patched:
# str.capitalize_custom = lambda self: self.title()
# TypeError: cannot set 'capitalize_custom' attribute of immutable type 'str'""",
      "inReality": """• Class Dict Mutation: Python dynamically inserts the function into the class's '__dict__'. This modifies behavior globally across all modules in the process.
• C-extension Restrictions: CPython prevents modifying attributes on built-in types implemented in C (str, int, dict, list). You cannot add methods directly to Python's 'str' without subclassing or wrapping."""
    }
  },
  {
    "id": "tooling-and-ecosystem",
    "category": "Metaprogramming & Tooling",
    "title": "Package Management, Ecosystem & Tooling",
    "tags": ["pub", "pip", "Tooling", "Virtualenv", "pubspec"],
    "summary": "Project configuration, package managers, virtual environments, and formatting.",
    "keyTakeaway": "Dart includes a unified all-in-one CLI (dart format/analyze/test/compile/pub). Python relies on a multi-tool ecosystem (pip, venv, poetry, ruff, mypy).",
    "dartDoc": "https://dart.dev/tools",
    "pythonDoc": "https://packaging.python.org/en/latest/tutorials/installing-packages/",
    "dart": {
      "code": """# pubspec.yaml (Single source of truth)
name: my_app
version: 1.0.0
environment:
  sdk: '^3.0.0'

dependencies:
  http: ^1.2.0

dev_dependencies:
  test: ^1.25.0

# Official CLI tools bundled in standard SDK (dart.dev/tools):
# dart pub get       - Resolves & caches packages
# dart format .      - Official opinionated formatter
# dart analyze       - Static analysis & linting
# dart test          - Built-in test runner
# dart compile exe   - Compiles native executable""",
      "inReality": """• Global Central Cache: Packages are downloaded once to ~/.pub-cache and referenced via symlinks or package config maps (.dart_tool/package_config.json). No bloated per-project node_modules or virtual environments needed.
• Built-in Tooling: Formatting, linting, analysis, testing, doc generation, and compilation are all maintained by the core Dart team within the 'dart' command, ensuring 100% ecosystem consistency."""
    },
    "python": {
      "code": """# pyproject.toml / requirements.txt
# Requires virtual environment creation:
# python -m venv .venv
# source .venv/bin/activate
# pip install -r requirements.txt

# Modern Python tooling landscape (Multi-tool pipeline):
# uv / pip / poetry  - Dependency management & resolution
# ruff / black       - Code formatting
# flake8 / ruff      - Linting
# mypy / pyright     - Static type checking
# pytest             - Unit testing runner
# pyinstaller        - Bundling into executable""",
      "inReality": """• Virtual Environments: Python packages install directly into site-packages. Because different projects require different package versions, developers must isolate environments using 'venv' or 'conda' to prevent system-wide dependency conflicts.
• Tool Fragmentation: Unlike Dart's single official toolchain, Python relies on third-party tools for formatting (Ruff/Black), linting (Flake8/Pylint), type checking (Mypy/Pyright), and packaging (Poetry/Hatch/uv)."""
    }
  }
]

matrix = [
  {
    "feature": "Primary Execution",
    "dart": "Multi-target: Native AOT binary (ARM/x86), JIT (Dev), JS/Wasm (Web)",
    "python": "Bytecode interpreted on CPython Virtual Machine (ceval.c)",
    "winner": "Dart for raw execution speed & compilation versatility"
  },
  {
    "feature": "Type System",
    "dart": "Sound static typing with type inference & compile-time null safety",
    "python": "Dynamic typing (duck-typing) with optional type hints (ignored at runtime)",
    "winner": "Dart for type safety; Python for rapid exploratory scripting"
  },
  {
    "feature": "Concurrency",
    "dart": "Isolates (Isolated heaps, zero shared-memory locks, message passing)",
    "python": "OS Threads constrained by Global Interpreter Lock (GIL); Multiprocessing",
    "winner": "Dart for clean thread-safety; Python 3.13+ experimenting with free-threading"
  },
  {
    "feature": "Memory Management",
    "dart": "Generational Garbage Collector (Young nursery bump-allocator + Old Mark-Sweep)",
    "python": "Reference Counting (immediate deallocation) + Cyclical Generational GC",
    "winner": "Dart for low-latency UI frame rates; Python for instant deterministic cleanup"
  },
  {
    "feature": "Null Safety Guarantee",
    "dart": "100% Sound: Non-nullable types never hold null at compile or runtime",
    "python": "None is a runtime singleton object; checked dynamically or via Mypy",
    "winner": "Dart eliminates NullPointer/NoneType crashes completely"
  },
  {
    "feature": "Object Dispatch",
    "dart": "Virtual Tables (vtables) & devirtualization to direct machine instructions",
    "python": "Dynamic hash-table (__dict__) lookup & method resolution order (MRO)",
    "winner": "Dart for dispatch speed; Python for runtime introspection"
  },
  {
    "feature": "Toolchain",
    "dart": "Unified single CLI: format, analyze, test, pub, compile, run in one binary",
    "python": "Ecosystem-driven: pip, venv, poetry, uv, ruff, black, mypy, pytest",
    "winner": "Dart for out-of-the-box developer ergonomics"
  }
]

with open("/Users/kalimullah/.gemini/antigravity/scratch/dart-vs-python-cheatsheet/data.js", "w") as f:
    f.write("// Dart vs Python Comprehensive Cheatsheet Dataset (Grounded in Official dart.dev & docs.python.org)\n")
    f.write("const CHEATSHEET_DATA = " + json.dumps(data, indent=2) + ";\n\n")
    f.write("const ARCHITECTURE_MATRIX = " + json.dumps(matrix, indent=2) + ";\n")

print("Successfully generated data.js with official doc grounding")
