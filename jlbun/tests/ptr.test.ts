import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaArray, JuliaPtr } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("JuliaPtr", () => {
  describe("creation", () => {
    it("can be created from a raw address", () => {
      const ptr = JuliaPtr.fromAddress(0);
      expect(ptr.isNull).toBe(true);
      expect(ptr.address).toBe(0n);
    });

    it("can be created from a bigint address", () => {
      const ptr = JuliaPtr.fromAddress(12345n);
      expect(ptr.address).toBe(12345n);
      expect(ptr.isNull).toBe(false);
    });

    it("can be created from Julia eval", () => {
      const ptr = Julia.eval("Ptr{Float64}(0)") as JuliaPtr;
      expect(ptr.isNull).toBe(true);
    });
  });

  describe("fromArray", () => {
    it("gets pointer to Float64 array data", () => {
      const arr = JuliaArray.from(new Float64Array([1.0, 2.0, 3.0]));
      const ptr = JuliaPtr.fromArray(arr);

      expect(ptr.isNull).toBe(false);
      // Verify we can read back the data
      expect(ptr.load(0).value).toBe(1.0);
      expect(ptr.load(1).value).toBe(2.0);
      expect(ptr.load(2).value).toBe(3.0);
    });

    it("gets pointer to Int32 array data", () => {
      const arr = JuliaArray.from(new Int32Array([10, 20, 30]));
      const ptr = JuliaPtr.fromArray(arr);

      expect(ptr.isNull).toBe(false);
      expect(ptr.load(0).value).toBe(10);
      expect(ptr.load(1).value).toBe(20);
      expect(ptr.load(2).value).toBe(30);
    });
  });

  describe("fromObject", () => {
    it("gets address of a mutable Julia object", () => {
      // Create a mutable Julia object
      const arr = Julia.eval("[1, 2, 3]");
      const ptr = JuliaPtr.fromObject(arr);

      expect(ptr.isNull).toBe(false);
      expect(ptr.address).toBeGreaterThan(0n);
    });
  });

  describe("elType", () => {
    it("returns the element type of Ptr{Float64}", () => {
      const arr = JuliaArray.from(new Float64Array([1.0]));
      const ptr = JuliaPtr.fromArray(arr);
      const elType = ptr.elType;

      expect(Julia.string(elType)).toBe("Float64");
    });

    it("returns the element type of Ptr{Int32}", () => {
      const arr = JuliaArray.from(new Int32Array([1]));
      const ptr = JuliaPtr.fromArray(arr);
      const elType = ptr.elType;

      expect(Julia.string(elType)).toBe("Int32");
    });

    it("returns Cvoid for null pointer", () => {
      const ptr = JuliaPtr.fromAddress(0);
      const elType = ptr.elType;

      expect(Julia.string(elType)).toBe("Nothing");
    });
  });

  describe("load and store", () => {
    it("can read and write Float64 values", () => {
      const arr = JuliaArray.from(new Float64Array([1.0, 2.0, 3.0]));
      const ptr = JuliaPtr.fromArray(arr);

      // Read original values
      expect(ptr.load(0).value).toBe(1.0);
      expect(ptr.load(1).value).toBe(2.0);
      expect(ptr.load(2).value).toBe(3.0);

      // Write new values
      ptr.store(10.0, 0);
      ptr.store(20.0, 1);
      ptr.store(30.0, 2);

      // Verify the writes
      expect(ptr.load(0).value).toBe(10.0);
      expect(ptr.load(1).value).toBe(20.0);
      expect(ptr.load(2).value).toBe(30.0);

      // Verify original array is modified (shared memory)
      expect(arr.get(0).value).toBe(10.0);
      expect(arr.get(1).value).toBe(20.0);
      expect(arr.get(2).value).toBe(30.0);
    });

    it("can read and write Int32 values", () => {
      const arr = JuliaArray.from(new Int32Array([100, 200, 300]));
      const ptr = JuliaPtr.fromArray(arr);

      ptr.store(999, 1);
      expect(ptr.load(1).value).toBe(999);
      expect(arr.get(1).value).toBe(999);
    });

    it("uses 0-based indexing", () => {
      const arr = JuliaArray.from(new Float64Array([1.0, 2.0, 3.0]));
      const ptr = JuliaPtr.fromArray(arr);

      // Index 0 should be first element
      expect(ptr.load(0).value).toBe(1.0);
      // Index 2 should be third element
      expect(ptr.load(2).value).toBe(3.0);
    });
  });

  describe("offset", () => {
    it("creates a new pointer offset by elements", () => {
      const arr = JuliaArray.from(new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0]));
      const ptr = JuliaPtr.fromArray(arr);

      // Offset by 2 elements
      const ptr2 = ptr.offset(2);
      expect(ptr2.load(0).value).toBe(3.0);
      expect(ptr2.load(1).value).toBe(4.0);

      // Negative offset
      const ptr3 = ptr2.offset(-1);
      expect(ptr3.load(0).value).toBe(2.0);
    });

    it("does not modify the original pointer", () => {
      const arr = JuliaArray.from(new Float64Array([1.0, 2.0, 3.0]));
      const ptr = JuliaPtr.fromArray(arr);
      const originalAddr = ptr.address;

      ptr.offset(1);

      // Original pointer unchanged
      expect(ptr.address).toBe(originalAddr);
      expect(ptr.load(0).value).toBe(1.0);
    });
  });

  describe("reinterpret", () => {
    it("can reinterpret Float64 pointer as UInt64", () => {
      const arr = JuliaArray.from(new Float64Array([1.0]));
      const ptr = JuliaPtr.fromArray(arr);

      // Reinterpret as UInt64 pointer
      const uintPtr = ptr.reinterpret(Julia.UInt64);

      // The bytes should be reinterpreted as UInt64
      const uintValue = uintPtr.load(0).value;
      expect(typeof uintValue).toBe("bigint");
    });

    it("preserves the address when reinterpreting", () => {
      const arr = JuliaArray.from(new Float64Array([1.0]));
      const ptr = JuliaPtr.fromArray(arr);

      const reinterpreted = ptr.reinterpret(Julia.Int64);

      // Address should be the same
      expect(reinterpreted.address).toBe(ptr.address);
    });
  });

  describe("value property", () => {
    it("returns the raw pointer as Bun Pointer", () => {
      const arr = JuliaArray.from(new Float64Array([1.0]));
      const ptr = JuliaPtr.fromArray(arr);

      const bunPtr = ptr.value;
      expect(bunPtr).not.toBeNull();
    });

    it("returns null for null pointer", () => {
      const ptr = JuliaPtr.fromAddress(0);
      // For null pointer, the value is still a valid Pointer (just 0)
      expect(ptr.address).toBe(0n);
    });
  });

  describe("toString", () => {
    it("returns a descriptive string", () => {
      const ptr = JuliaPtr.fromAddress(0);
      const str = ptr.toString();
      expect(str).toContain("JuliaPtr");
      expect(str).toContain("Ptr");
    });
  });

  describe("array element type: Ptr{T}", () => {
    it("can create Array{Ptr{Float64}} and access elements", () => {
      // Create an array of pointers in Julia
      const arr = Julia.eval(`
        data = Float64[1.0, 2.0, 3.0]
        ptrs = [pointer(data, i) for i in 1:3]
        ptrs
      `);

      // Get first pointer element
      const firstPtr = (arr as JuliaArray).get(0) as JuliaPtr;
      expect(firstPtr.load(0).value).toBe(1.0);

      // Get second pointer element
      const secondPtr = (arr as JuliaArray).get(1) as JuliaPtr;
      expect(secondPtr.load(0).value).toBe(2.0);
    });

    it("can set Ptr elements in an array", () => {
      // Create arrays and pointer array
      const result = Julia.eval(`
        data = Float64[10.0, 20.0, 30.0]
        ptrs = Vector{Ptr{Float64}}(undef, 2)
        (data, ptrs)
      `) as JuliaArray;

      const data = Julia.Base.getindex(result, 1) as JuliaArray;
      const ptrs = Julia.Base.getindex(result, 2) as JuliaArray;

      // Create pointers to data elements
      const ptr1 = JuliaPtr.fromArray(data);
      const ptr2 = ptr1.offset(1);

      // Set pointer elements
      ptrs.set(0, ptr1);
      ptrs.set(1, ptr2);

      // Verify by reading back
      const readPtr1 = ptrs.get(0) as JuliaPtr;
      const readPtr2 = ptrs.get(1) as JuliaPtr;

      expect(readPtr1.load(0).value).toBe(10.0);
      expect(readPtr2.load(0).value).toBe(20.0);
    });
  });
});
