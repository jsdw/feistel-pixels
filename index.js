const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");

let roundFunction = () => 0;
let numRounds = 0;
let numSamples = 0;
let numLowBits = 0;
let numHighBits = 0;

function feistel(input, lowBits, highBits, rounds, roundFunction) {
    const lowMask = (1 << lowBits) - 1;
    const highMask = (1 << highBits) - 1;
    const fullMask = (1 << (lowBits + highBits)) - 1;

    for (let i = 0; i < rounds; i++) {
        let r = input & lowMask;
        let l = (input >> lowBits) & highMask;

        const last_l = l;
        l = r ^ roundFunction(l);
        r = last_l;

        input = (l << highBits) | r;
    }

    return input & fullMask;
}

function refresh(){

    const w = canvasEl.width;
    const h = canvasEl.height;
    const size = w * h;

    const buf = new ArrayBuffer(size * 4);
    const u8 = new Uint8ClampedArray(buf);
    const u32 = new Uint32Array(buf);

    const black = 255 << 24;
    const len = Math.pow(2, numLowBits + numHighBits);

    let seen = 0;
    let missed = 0;
    for(let i = 0; i < len && seen < numSamples; i++) {
        const outPx = feistel(i, numLowBits, numHighBits, numRounds, roundFunction);
        if(outPx < size) {
            u32[outPx] = black;
            seen++;
        } else {
            missed++;
        }
    }

    ctx.putImageData(new ImageData(u8, w, h), 0, 0);

}

// Very basic approach to bind to each of our inputs. The init()
// function wires this all up.
const inputBindings = {
    width: {
        initialValue: 400,
        onUpdate: (el) => {
            canvasEl.width = parseInt(el.value, 10);
            inputBindings.low_bits.onUpdate();
            inputBindings.high_bits.onUpdate();
        }
    },
    height: {
        initialValue: 300,
        onUpdate: (el) => {
            canvasEl.height = parseInt(el.value, 10);
            inputBindings.low_bits.onUpdate();
            inputBindings.high_bits.onUpdate();
        }
    },
    rounds: {
        initialValue: 5,
        onUpdate: (el) => {
            numRounds = parseInt(el.value, 10);
        }
    },
    samples: {
        initialValue: 10000,
        onUpdate: (el) => {
            numSamples = parseInt(el.value, 10);
        }
    },
    function: {
        initialValue: "(((bits * 11) + (bits >> 5) + 7 * 127) ^ bits) & 0xff",
        onUpdate: (el) => {
            try {
                roundFunction = new Function(["bits"], "return "+el.value);
                el.classList.remove("invalid");
            } catch(e) {
                el.classList.add("invalid");
            }
        }
    },
    low_bits: {
        initialValue: 8,
        onUpdate: (el) => {
            const maxBits = Math.max(Math.ceil(Math.log2(canvasEl.height * canvasEl.width)), 1);
            numLowBits = Math.max(1, Math.min(maxBits-1, parseInt(el.value, 10)));
            numHighBits = maxBits - numLowBits;
            el.value = numLowBits;
            inputBindings.high_bits.el.value = numHighBits;
        }
    },
    high_bits: {
        initialValue: 9,
        onUpdate: (el) => {
            const maxBits = Math.max(Math.ceil(Math.log2(canvasEl.height * canvasEl.width)), 1);
            numHighBits = Math.max(1, Math.min(maxBits-1, parseInt(el.value, 10)));
            numLowBits = maxBits - numHighBits;
            el.value = numHighBits;
            inputBindings.low_bits.el.value = numLowBits;
        }
    },
};

function init() {

    // set up the bindings:
    for(const elementId in inputBindings) {
        const binding = inputBindings[elementId];
        const el = document.getElementById(elementId);
        const onUpdate = binding.onUpdate;
        binding.el = el;
        binding.onUpdate = () => onUpdate(el);
        el.value = binding.initialValue;
        el.addEventListener("input", () => { binding.onUpdate(); refresh() });
    }

    // run an initial pass to use the bindings to init things:
    for(const elementId in inputBindings) {
        inputBindings[elementId].onUpdate();
    }

    refresh();
}

init();
testFeistel();

// A sanity check that the feistel implementation is working as expected:
function testFeistel() {

    // bits, rounds
    const tests = [
        [2, 1, r => 1],
        [2, 1, r => r * 7013],
        [2, 1, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [2, 2, r => 1],
        [2, 2, r => r * 7013],
        [2, 2, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [2, 3, r => 1],
        [2, 3, r => r * 7013],
        [2, 3, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [3, 1, r => 1],
        [3, 1, r => r * 7013],
        [3, 1, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [3, 2, r => 1],
        [3, 2, r => r * 7013],
        [3, 2, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [3, 3, r => 1],
        [3, 3, r => r * 7013],
        [3, 3, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [4, 1, r => 1],
        [4, 1, r => r * 7013],
        [4, 1, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [4, 2, r => 1],
        [4, 2, r => r * 7013],
        [4, 2, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [4, 3, r => 1],
        [4, 3, r => r * 7013],
        [4, 3, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [4, 4, r => 1],
        [4, 4, r => r * 7013],
        [4, 4, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [4, 5, r => 1],
        [4, 5, r => r * 7013],
        [4, 5, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [5, 1, r => 1],
        [5, 1, r => r * 7013],
        [5, 1, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [5, 2, r => 1],
        [5, 2, r => r * 7013],
        [5, 2, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [5, 3, r => 1],
        [5, 3, r => r * 7013],
        [5, 3, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [5, 4, r => 1],
        [5, 4, r => r * 7013],
        [5, 4, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
        [5, 5, r => 1],
        [5, 5, r => r * 7013],
        [5, 5, r => ((r * 11) + (r >> 5) + 7 * 127) ^ r],
    ]

    let len_errs = 0;
    let dupe_errs = 0;

    tests.forEach(([bits,rounds]) => {

        const seen = new Set();
        const len = Math.pow(2, bits);
        for(let i = 0; i < len; i++) {
            const out = feistel(i, bits, rounds, (r) => 1);
            if(out < 0 || out >= len) {
                len_errs++;
                //console.error(`LENGTH EXCEEDED! bits: ${bits}, rounds: ${rounds}, max: ${len-1}, ${i} => ${out}`);
            }
            if(seen.has(out)) {
                dupe_errs++;
                //console.error(`DUPE DETECTED! bits: ${bits}, rounds: ${rounds}, ${i} => ${out}`);
            }
            seen.add(out);
        }

    });

    if(len_errs) console.error(`length exceeded ${len_errs} times`);
    if(dupe_errs) console.error(`dupe detected ${dupe_errs} times`);

}
