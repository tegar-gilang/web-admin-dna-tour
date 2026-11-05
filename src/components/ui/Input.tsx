import * as React from "react"
import { cn, formatThousand } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  thousandSeparator?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      thousandSeparator,
      value,
      defaultValue,
      placeholder,
      onChange,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    // Aktifkan pemisah ribuan titik jika thousandSeparator=true,
    // atau jika type="number" dan bukan step="any" (bukan koordinat/float)
    const isThousandSeparated =
      thousandSeparator ?? (type === 'number' && props.step !== 'any');

    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const cursorPosRef = React.useRef<number | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    // Format nilai untuk tampilan UI
    const displayValue = React.useMemo(() => {
      if (!isThousandSeparated) return value;
      if (value === undefined || value === null) return value;
      return formatThousand(value as any);
    }, [value, isThousandSeparated]);

    const displayDefaultValue = React.useMemo(() => {
      if (!isThousandSeparated || defaultValue === undefined || defaultValue === null) {
        return defaultValue;
      }
      return formatThousand(defaultValue as any);
    }, [defaultValue, isThousandSeparated]);

    // Format angka pada placeholder jika ada angka 4 digit atau lebih (misal: 30000000 -> 30.000.000)
    const formattedPlaceholder = React.useMemo(() => {
      if (!placeholder || !isThousandSeparated) return placeholder;
      return placeholder.replace(/\d{4,}/g, (match) => formatThousand(match));
    }, [placeholder, isThousandSeparated]);

    // Pertahankan posisi kursor saat terjadi format ulang titik ribuan
    React.useLayoutEffect(() => {
      if (isThousandSeparated && cursorPosRef.current !== null && internalRef.current) {
        const pos = cursorPosRef.current;
        internalRef.current.setSelectionRange(pos, pos);
        cursorPosRef.current = null;
      }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isThousandSeparated) {
        onChange?.(e);
        return;
      }

      const input = e.target;
      const rawValue = input.value.replace(/\D/g, '');
      const formatted = formatThousand(rawValue);

      // Hitung posisi kursor baru berdasarkan jumlah digit sebelum kursor
      const cursorIndex = input.selectionStart ?? input.value.length;
      const digitsBeforeCursor = input.value.slice(0, cursorIndex).replace(/\D/g, '').length;

      let nextCursorPos = formatted.length;
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
        if (digitCount === digitsBeforeCursor) {
          nextCursorPos = i + 1;
          break;
        }
      }
      cursorPosRef.current = nextCursorPos;

      // Buat target proxy dengan nilai mentah murni (tanpa titik)
      // sehingga Number(e.target.value) / parseInt(e.target.value) di komponen pemanggil tetap 100% akurat
      const targetProxy = new Proxy(input, {
        get(target, prop, receiver) {
          if (prop === 'value') return rawValue;
          if (prop === 'valueAsNumber') return rawValue ? Number(rawValue) : NaN;
          return Reflect.get(target, prop, receiver);
        }
      });

      const syntheticEvent = {
        ...e,
        target: targetProxy,
        currentTarget: targetProxy,
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isThousandSeparated && e.key === 'Backspace') {
        const input = e.currentTarget;
        const { selectionStart, selectionEnd } = input;
        if (selectionStart !== null && selectionStart === selectionEnd && selectionStart > 1) {
          if (input.value[selectionStart - 1] === '.') {
            e.preventDefault();
            const val = input.value;
            const newVal = val.slice(0, selectionStart - 2) + val.slice(selectionStart);
            const raw = newVal.replace(/\D/g, '');
            const formatted = formatThousand(raw);

            const digitsBefore = val.slice(0, selectionStart - 2).replace(/\D/g, '').length;
            let nextPos = 0;
            let count = 0;
            for (let i = 0; i < formatted.length; i++) {
              if (/\d/.test(formatted[i])) {
                count++;
              }
              if (count === digitsBefore) {
                nextPos = i + 1;
                break;
              }
            }
            cursorPosRef.current = nextPos;

            const targetProxy = new Proxy(input, {
              get(target, prop, receiver) {
                if (prop === 'value') return raw;
                if (prop === 'valueAsNumber') return raw ? Number(raw) : NaN;
                return Reflect.get(target, prop, receiver);
              }
            });

            const syntheticEvent = {
              ...e,
              target: targetProxy,
              currentTarget: targetProxy,
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            onChange?.(syntheticEvent);
            return;
          }
        }
      }

      if (isThousandSeparated && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const input = e.currentTarget;
        const min = props.min !== undefined ? Number(props.min) : undefined;
        const max = props.max !== undefined ? Number(props.max) : undefined;
        const currentNum = Number(input.value.replace(/\D/g, '')) || 0;
        let nextNum = e.key === 'ArrowUp' ? currentNum + 1 : currentNum - 1;
        if (min !== undefined && nextNum < min) nextNum = min;
        if (max !== undefined && nextNum > max) nextNum = max;
        if (nextNum < 0 && (min === undefined || min >= 0)) nextNum = 0;

        const raw = String(nextNum);
        const formatted = formatThousand(raw);
        cursorPosRef.current = formatted.length;

        const targetProxy = new Proxy(input, {
          get(target, prop, receiver) {
            if (prop === 'value') return raw;
            if (prop === 'valueAsNumber') return nextNum;
            return Reflect.get(target, prop, receiver);
          }
        });

        const syntheticEvent = {
          ...e,
          target: targetProxy,
          currentTarget: targetProxy,
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
        return;
      }

      onKeyDown?.(e);
    };

    // Bersihkan props yang tidak relevan untuk input type text ketika thousand separator aktif
    const { min, max, step, ...cleanProps } = props;

    return (
      <input
        type={isThousandSeparated ? "text" : type}
        inputMode={isThousandSeparated ? "numeric" : props.inputMode}
        value={value !== undefined ? (isThousandSeparated ? displayValue : value) : undefined}
        defaultValue={defaultValue !== undefined ? (isThousandSeparated ? displayDefaultValue : defaultValue) : undefined}
        placeholder={formattedPlaceholder}
        className={cn(
          "flex h-10 w-full rounded-xl border border-gray-200/90 bg-white px-3.5 py-2 text-xs sm:text-sm font-normal text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900/20 focus-visible:border-[#740A03] shadow-2xs transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={setRefs}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...(isThousandSeparated ? cleanProps : props)}
      />
    );
  }
);
Input.displayName = "Input"

export { Input }
