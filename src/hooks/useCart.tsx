import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  amountOfProduct: (productId: number) => Number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  async function checkQuantityInStock(productId: Number, amount: Number) {
    const response = await api.get(`/stock/${productId}`);
    const productStock:Stock = response.data;
    if (productStock.amount >= amount) {
      return true;
    } else {
      return false;
    }
  }
  // localStorage.clear();

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque'); 
        return;
      }

      if (productExists) {  
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        }

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      // api.get(`/products/${productId}`)
      //   .then((response) => {
      //     const product:Product = response.data;
      //     let isTheProductInTheCart = false;

      //     cart.map((cartProduct) => {
      //       if (productId === cartProduct.id) {
      //         isTheProductInTheCart = true;
      //         const amount = cartProduct.amount + 1;
      //         updateProductAmount({productId, amount});          
      //       }
      //     });

      //     if (isTheProductInTheCart === false) {
      //       const newCart: Array<Product> = [];
      //       newCart.push(...cart, {
      //         ...product,
      //         amount: 1
      //       });
      //       setCart(newCart);
      //     }
      //   })
      //   .catch(() => {
      //     toast.error('Erro na adição do produto');
      //   })
        
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
      // const newCart: Array<Product> = [];
      
      // cart.map((product) => {
      //   if (productId !== product.id) {
      //     newCart.push(product);
      //   }
      // });
      // setCart(newCart);

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const isAmountOfProductInStock = await checkQuantityInStock(productId, amount);
      
      if (isAmountOfProductInStock && amount >= 1) {
        const newCart: Array<Product> = [];
        cart.map((product) => {
          if (productId === product.id) {
            newCart.push({
              id: product.id,
              amount: amount,
              image: product.image,
              title: product.title,
              price: product.price
            });
          } else {
            newCart.push(product);
          }        
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque'); 
      }     
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const amountOfProduct = (productId: Number) => {
    let productAmount = 0;
    cart.map((product) => {
      if (product.id === productId) {
        productAmount = product.amount;
      }
    });

    return productAmount;
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, amountOfProduct }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
